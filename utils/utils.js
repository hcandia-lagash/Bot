const util = require('util');
const soap = require('soap');
const request = require('request');
const md5 = require('md5');
const moment = require('moment');
const fs = require('fs');

var _GetCreditos = function(session){

    if (!session.userData || !session.userData.creditos || !session.userData.rut) {
        _GetUserData(session);
    } else {
        var lastCheck = moment().diff(session.userData.creditosTimeStamp, 'm');
        if (lastCheck > 30) {
            _GetUserData(session);
        }
    }
    return session.userData.creditos;
}

var _GetCredito = function (session, credito) {
    var creditos = _GetCreditos(session);

    if (!creditos) {
        _SinDatosCreditos(session);
    } else {
        for (var i = 0; i < creditos.length; i++) {
            if (creditos[i].Id_credito == credito) {

                session.userData.ultimoCredito = credito;
                session.save();

                var proximoVencimiento = _GetProximoVencimiento(session, credito);
                var proximoVencimientoMessage = "#### Próximo vencimiento\n\n";

                if (proximoVencimiento) {
                    proximoVencimientoMessage += "Cuota número: **%s**\n\n";
                    proximoVencimientoMessage += "Fecha: **%s**\n\n";
                    proximoVencimientoMessage += "Importe: **$ %s**\n\n";
                    proximoVencimientoMessage = util.format(proximoVencimientoMessage,
                        proximoVencimiento.Numero_cuota_sistema,
                        moment(proximoVencimiento.Fecha_vencimiento_cuota).format('LL'),
                        proximoVencimiento.Valor_cuota
                    );
                } else {
                    proximoVencimientoMessage = "Todas las cuotas del crédito han sido abonadas.";
                }

                var message = "### Información del crédito %s\n\n";

                message += "---\n\n";
                message += "Fecha de otorgamiento: **%s**\n\n";
                message += "Cantidad de cuotas: **%s**\n\n";
                message += "Monto a financiar: **$ %s**\n\n";
                message += "Pie: **$ %s**\n\n";
                message += "Monto cuota: **$ %s**\n\n";
                message += "Tipo de crédito: **%s**\n\n";
                message += "---\n\n";
                message += "%s";

                var out = util.format(message,
                    creditos[i].Id_credito,
                    moment(creditos[i].Fecha_hora_otorgamiento).format('LL'),
                    creditos[i].Plazo,
                    creditos[i].Monto_a_financiar,
                    creditos[i].Pie,
                    creditos[i].Monto_cuota_constante,
                    creditos[i].Codigo_tipo_credito,
                    proximoVencimientoMessage);

                return out;
            }
        }
        return false;
    }
}

var _GetUserData = function(session){
    
    // Enrolment mock
    //var enrolmentData = fs.readFileSync('./enrolment/enrolled_users.js', 'utf8');
    //var enroledUsers = JSON.parse(enrolmentData);
    //session.userData.rut = enroledUsers[Math.floor(Math.random() * enroledUsers.length)].rut;
    session.userData.rut = process.env.RUT_CLIENTE;
    session.save();

    const auth = "Basic " + new Buffer(process.env.TANNER_CREDITOS_SERVICE_USER + ":" + process.env.TANNER_CREDITOS_SERVICE_PWD).toString("base64");
    const soapOptions = {
        wsdl_headers: {
            Authorization: auth
        },
        disableCache: true,
        endpoint: process.env.TANNER_CREDITOS_SERVICE_ENDPOINT
    };

    var soapClient = soap.createClient(process.env.TANNER_CREDITOS_SERVICE_WSDL, soapOptions, function (error, client) {
        if (!error) {
            client.setSecurity(new soap.BasicAuthSecurity(process.env.TANNER_CREDITOS_SERVICE_USER, process.env.TANNER_CREDITOS_SERVICE_PWD));

            var test = client.ObtenerCreditoDetalle({
                rut: session.userData.rut
            }, function (error, result) {
                if (error) {
                    session.send('**Error**: Se produjo el siguiente error intentando consultar sus créditos: **%s**\n\nPor favor reporte este inconveniente.', error);
                    session.cancelDialog();
                } else {
                    if(result.Credito.Lista_credito == null)
                    {
                        session.userData.creditos = null;
                        session.save();
                        return;
                    }
                    session.userData.creditos = result.Credito.Lista_credito.CreditoET;

                    var jsonCreditos = JSON.stringify(session.userData.creditos);
                    var md5Creditos = md5(jsonCreditos);

                    if (md5Creditos != session.userData.creditosHash) {
                        session.send('**Información**: Nueva información sobre créditos está disponible y será utilizada en tus próximas consultas.\n\nTipea **creditos** para seleccionar alguno de tus créditos.');
                    }
                    session.userData.creditosHash = md5Creditos;
                    session.userData.creditosTimeStamp = new Date();
                    session.userData.ultimoCredito = "";
                    session.save();
                }
            });
        } else {
            session.endDialog('Se ha producido un error al intentar recuperar la información más reciente sobre tus créditos, por favor intenta nuevamente en unos instantes.');
        }
    });
};

var _GetCuotas = function(session, id_credito){
    var creditos = _GetCreditos(session);
    var out = null;

    if (!creditos) {
        _SinDatosCreditos(session);
    } else {
        if (session.userData.ultimoCredito) {
            var cuotas = null;
            for (var i = 0; i < creditos.length; i++) {
                if (creditos[i].Id_credito == session.userData.ultimoCredito) {
                    cuotas = creditos[i].Credito_cuotas;
                    break;
                }
            }

            for (var c = 0; c < cuotas.CuotaET.length; c++) {
                if (cuota == cuotas.CuotaET[c].Numero_cuota_sistema) {
                    out = "### Cuota %s - Crédito %s\n\n";
                    out += "---\n\n";
                    out += "Importe: **$ %s**\n\n";
                    out += "Vencimiento: **%s**\n\n";
                    out += "Estado: **%s**\n\n";

                    out = util.format(out,
                        cuota,
                        session.userData.ultimoCredito,
                        cuotas.CuotaET[c].Valor_cuota,
                        moment(cuotas.CuotaET[c].Fecha_vencimiento_cuota).format("LL"),
                        (cuotas.CuotaET[c].Codigo_estado_cuota == "PA") ? "Pagada" : "Impaga");
                    break;
                }
            }
            if (!out) {
                out = util.format("No existe información para la cuota solicitada del crédito %s, el rango válido de número de cuota es de 1 a %s",
                    session.userData.ultimoCredito,
                    cuotas.CuotaET.length);
            }
        } else {
            out = "Para solicitar información de una cuota deberás primero seleccionar un crédito, tipea **creditos** y escoge uno de la lista";
        }
    }
    return out;
};

var _SinDatosCreditos = function (session) {
    session.endDialog("**Información**: No dispongo aún de información sobre tus créditos, reintenta en unos segundos por favor, te notificaré en cuanto los reciba.");
}

var _GetProximoVencimiento = function (session, credito) {
    var creditos = _GetCreditos(session);
    var out = null;

    if (!creditos) {
        _SinDatosCreditos(session);
    } else {
        for (var i = 0; i < creditos.length; i++) {
            if (creditos[i].Id_credito == credito || !credito) {
                for (var c = 0; c < creditos[i].Credito_cuotas.CuotaET.length; c++) {
                    if (creditos[i].Credito_cuotas.CuotaET[c].Codigo_estado_cuota == 'VI') {
                        out = creditos[i].Credito_cuotas.CuotaET[c];
                        break;
                    }
                }
            }
        }
    }
    return out;
}

module.exports = {
    GetCreditos: _GetCreditos,
    GetUserData: _GetUserData,
    GetCuotas: _GetCuotas,
    GetCredito: _GetCredito
}