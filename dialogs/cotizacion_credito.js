var builder = require('botbuilder');

var lib = new builder.Library('cotizacion_credito');

lib.dialog('/', [
    function (session, args, next) {
        session.dialogData.DatosCotizacion = args || {};
        if (!session.dialogData.DatosCotizacion.TipoVehiculo) {
            builder.Prompts.choice(session, "¿Puedes indicarme el tipo de vehículo para el que quieres el crédito?\n\n",['Nuevo','Usado'],{ retryPrompt: 'Debes seleccionar una opción válida', inputHint:'',listStyle: builder.ListStyle['button'], promptAfterAction:false});
         } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosCotizacion.TipoVehiculo = results.response.entity;
        }
        if (!session.dialogData.DatosCotizacion.Valor) {            
            builder.Prompts.number(session, "¿Puedes indicarme el valor del vehículo?", { minValue:0, retryPrompt:'Debes ingresar un monto válido' });
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosCotizacion.Valor = results.response;
        }
        if (!session.dialogData.DatosCotizacion.MontoPie) {            
            builder.Prompts.number(session, "¿Puedes indicarme el monto del pie que deseas dar?",{ minValue:0, retryPrompt:'Debes ingresar un monto válido' });
            
        } else {
             next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosCotizacion.MontoPie = results.response;
        }
        if (!session.dialogData.DatosCotizacion.RentaLiquida) {                    
            builder.Prompts.text(session, "¿Puedes indicarme tu renta líquida actual?");
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosCotizacion.RentaLiquida = results.response;
        }
        if (!session.dialogData.DatosCotizacion.NumeroCuotas) {         
            builder.Prompts.choice(session, "Selecciona el número de cuotas que deseas cotizar.\n",['12','24','36','48','60'],{ retryPrompt: 'Debes seleccionar una opción válida', listStyle: builder.ListStyle['button']});
            } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosCotizacion.NumeroCuotas = results.response.entity;
        }
        if(!session.dialogData.DatosCotizacion.Email){            
            session.beginDialog('validators:email',{ prompt: '¿Puedes indicarme tu email para enviarte la cotización?', retryPrompt: 'Debe ingresar un email válido' });            
        }else{
            next();
        }        
    },
    function (session, results,next) {
        if (results.response) {          
            session.dialogData.DatosCotizacion.Email = results.response;
            session.send('Muchas gracias por solicitar una cotización de crédito. La información ha sido enviada a uno de nuestros ejecutivos, que te contactará a la brevedad. ¿Hay algo mas en lo que pueda ayudarte? Recuerda que puedes escribir "ayuda" en cualquier momento.');     
        }   
        session.endDialog();     
     }
]);

module.exports = lib;
// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};