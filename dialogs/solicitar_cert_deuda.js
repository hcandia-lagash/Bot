var builder = require('botbuilder');
const utils = require('../utils/utils');

var lib = new builder.Library('solicitar_cert_deuda');
const messages = require('../messages/messages');

lib.dialog('/', [
    function (session, args, next) {
        session.dialogData.DatosCertificadoDeuda = args || {};
        if (!session.dialogData.DatosCertificadoDeuda.IdCredito) {
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
                builder.Prompts.choice(session, "Selecciona el crédito: \n",opciones,{ retryPrompt: 'Debes seleccionar una opción válida', listStyle: builder.ListStyle['button']});
                
         } else {
            next();
        }
    },
    function (session, results, next) {
        if (results.response) {
            session.dialogData.DatosCertificadoDeuda.IdCredito = results.response.entity;
        }
        if(!session.dialogData.DatosCertificadoDeuda.Email){            
            session.beginDialog('validators:email',{ prompt: '¿Puedes indicarme tu email para enviarte el certificado?', retryPrompt: 'Debe ingresar un email válido' });            
        }else{
            next();
        }        
    },
    function (session, results,next) {
        if (results.response) {          
            session.dialogData.DatosCertificadoDeuda.Email = results.response;
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