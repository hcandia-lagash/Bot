var builder = require('botbuilder');
const utils = require('../utils/utils');

var lib = new builder.Library('solicitar_prepago');

const messages = require('../messages/messages');

lib.dialog('/', [
    function (session, args, next) {
        session.dialogData.DatosPrepago = args || {};
        if (!session.dialogData.DatosPrepago.Motivo) {
               builder.Prompts.text(session, "¿Puedes indicarme el motivo de la solicitud de prepago?");
         } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosPrepago.Motivo = results.response.entity;
        }
        if (!session.dialogData.DatosPrepago.IdCredito) {
                var opciones = new Array();
                var creditos = utils.GetCreditos(session);

                if(creditos == null){
                    session.send("No tienes creditos activos para realizar prepago.");
                    session.send(messages.OfrecerAyuda());
                    session.endDialog();
                    return;
                }

                for (var i = 0; i < creditos.length; i++) {
                    var opcion = { value: creditos[i].Id_credito.toString(), action: { title: 'Credito #'+creditos[i].Id_credito }};
                    opciones.push(opcion);   
                }               
                builder.Prompts.choice(session, "Selecciona el crédito que deseas prepagar.\n",opciones,{ retryPrompt: 'Debes seleccionar una opción válida', listStyle: builder.ListStyle['button']});
                
         } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosPrepago.IdCredito = results.response.entity;
        }
        if (!session.dialogData.DatosPrepago.Patente) {            
            builder.Prompts.time(session, 'Ingresar fecha de prepago (MM/dd/yyyy):', {
            retryPrompt: 'La fecha ingresada no es válida',
            maxRetries: 2
        });
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosPrepago.IdCredito = results.response.entity;
        }
        if (!session.dialogData.DatosPrepago.Patente) {            
            builder.Prompts.text(session, "¿Puedes indicarme la patente del vehículo?", { retryPrompt:'Debes ingresar una patente válida' });
        } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosPrepago.Patente = results.response.entity;
        }
        if(!session.dialogData.DatosPrepago.Email){            
            session.beginDialog('validators:email',{ prompt: '¿Puedes indicarme tu email para enviarte la solicitud?', retryPrompt: 'Debe ingresar un email válido' });            
        }else{
            next();
        }        
    },
    function (session, results,next) {
        if (results.response) {          
            session.dialogData.DatosPrepago.Email = results.response;
            session.send('Muchas gracias. La información ha sido enviada a uno de nuestros ejecutivos, que te contactará a la brevedad. ¿Hay algo mas en lo que pueda ayudarte? Recuerda que puedes escribir "ayuda" en cualquier momento.');     
        }   
        session.endDialog();     
     }
]);

module.exports = lib;
// Export createLibrary() function
module.exports.createLibrary = function () {
    return lib.clone();
};