const appInsights = require("applicationinsights");
const dotenv = require('dotenv').config();
const builder = require('botbuilder');
const restify = require('restify');
const util = require('util');
var removeDiacritics = require('diacritics').remove;
const moment = require('moment');
const validator = require('validator');
moment.locale("ES");
const server = restify.createServer();
var cognitiveservices = require('botbuilder-cognitiveservices');

//App modules
const messages = require('./messages/messages');
const entities = require('./LUIS/entities');
const intents = require('./LUIS/intents');
const scores = require('./LUIS/scores');
const utils = require('./utils/utils');

server.use(restify.bodyParser());

server.use(function (request, response, next) {
    if (request.body.text) {
        request.body.text = removeDiacritics(request.body.text);
    }
    next();
});

// Setup bot
const connector = new builder.ChatConnector({
    appId: '0fd45fb2-4d78-447e-ab2d-5fbba9b91c1f',
    appPassword: '9eDK5a4yHpOsgghCws1hP6c'
});

const bot = new builder.UniversalBot(connector);

// Setup LUIS
// demo LUIS para pruebas
var QNARecognizer = new cognitiveservices.QnAMakerRecognizer({
	knowledgeBaseId: process.env.QnA_KNOWLEDGE_BASE_ID, 
	subscriptionKey: process.env.QnA_SUBSCRIPTION_KEY,
    qnaThreshold: 1
});

const LUISRecognizer = new builder.LuisRecognizer(process.env.LUIS_ENDPOINT);
const intent = new builder.IntentDialog({ 
    recognizers: [LUISRecognizer, QNARecognizer]
})
.onBegin(function (session, results, next) {
        //TODO: get userdata
        utils.GetUserData(session);
        next();
    })

// waterfall steps
.matches(intents.saludar, function (session, results) {
    session.send(messages.Saludar(session));
})
.matches(intents.ver_creditos, function (session, results) {
    var buttons = new Array();
    var creditos = utils.GetCreditos(session);
    if(creditos != null){        
    session.send('Entendido! Estos son los créditos que tienes vigentes. Selecciona uno para ver más información del crédito.');
    for (var i = 0; i < creditos.length; i++) {
                buttons.push(builder.CardAction.postBack(session, "Credito " + creditos[i].Id_credito, "Crédito #" + creditos[i].Id_credito
                ));
    }
    var card = new builder.HeroCard(session)
                .title("Tus créditos activos")
                .subtitle("Sitio Privado Automotriz")
                .text("Selecciona uno de tus créditos activos de la siguiente lista para poder brindarte información sobre el mismo:")
                .buttons(buttons);

            var message = new builder.Message(session).addAttachment(card);
            session.send(message);
    }else{
        session.send("Usted no posee créditos activos actualmente.");
    }
})
.matches(intents.cotizar_creditos, function(session, results){
        session.beginDialog('cotizacion_credito:/', session.userData.DatosCotizacion);        
})
.matches(intents.ver_credito, function(session, results){
        var creditoNumero = builder.EntityRecognizer.findEntity(results.entities, entities.numero_credito);  
        var creditoResponse = utils.GetCredito(session, creditoNumero.entity);
                if (creditoResponse) {
                    session.send(creditoResponse);
                    session.send(messages.OfrecerAyuda());
                } else {
                    session.send("El número **%d** no corresponde a ninguno de tus créditos activos.",
                        creditoNumero.entity);
                }   
})
.matches(intents.cuotas_pagadas, function (session, results) {
    session.send('Para mostrarte las cuotas pagadas debes seleccionar el crédito. Selecciona uno para ver más información.');
    var buttons = new Array();
    var creditos = utils.GetCreditos(session);
    for (var i = 0; i < creditos.length; i++) {
                buttons.push(builder.CardAction.postBack(session, "Cuota Credito " + creditos[i].IdCredito, "Crédito #" + creditos[i].IdCredito
                ));
    }
    var card = new builder.HeroCard(session)
                .title("Tus créditos activos")
                .subtitle("Sitio Privado Automotriz")
                .text("Selecciona uno de tus créditos activos de la siguiente lista para poder brindarte información sobre el mismo:")
                .buttons(buttons);

            var message = new builder.Message(session).addAttachment(card);
            session.send(message);
})
.matches(intents.detalle_cuotas_credito, function(session,results){
    session.sendTyping();
    var creditoNumero = builder.EntityRecognizer.findEntity(results.entities, entities.numero_credito); 
    var response = utils.GetCuotas(session, creditoNumero.entity);
    if(response){
        session.send("Las cuotas que tienes pagadas para el crédito %s son:",creditoNumero.entity);        
        session.send(response);
        session.send(messages.OfrecerAyuda);
    }
})
.matches(intents.solicitar_alzamiento, function(session, results){    
    session.beginDialog('solicitar_alzamiento:/', session.userData.DatosAlzamiento);  
})
.matches(intents.solicitar_prepago, function(session, results){
    session.beginDialog('solicitar_prepago:/', session.userData.DatosPrepago);  
})
.matches(intents.ver_certificado_deuda, function(session, results){
    session.beginDialog('solicitar_cert_deuda:/', session.userData.DatosCertDeuda);  
})
.matches(intents.ver_certificado_devolucion, function(session, results){
    session.beginDialog('solicitar_cert_devolucion:/', session.userData.DatosCertDevolucion);
})
.matches(intents.insulto, function(session, results){
    
    if(results.score > scores.secure_match){   
        session.send("Lo siento, no estoy disponible para recibir insultos, ¿Necesitas ayuda en algo?"); 
    }else{
        session.send('Hmmm... no pude comprender tu pregunta **"%s"**. Necesitas ayuda?', session.message.text);
    }

})
.matches(intents.despedida, function(session, results){
    session.send("Hasta Pronto, espero haber ayudado a resolver tus dudas."); 
})
.matches(intents.ayuda, function (session, results) {
        session.sendTyping();

        var card = new builder.HeroCard(session)
            .title("Asistencia al usuario")
            .subtitle("Sitio Privado Automotriz")
            .images([builder.CardImage.create(session, process.env.BOT_URL + "/assets/r2d2_600px.png")])
            .text("En Tanner tenemos varios servicios a tu disposición mediante los cuales podemos brindarte la asistencia que necesitas.\n\nEscoje una de las siguientes formas de asistencia:")
            .buttons([
                builder.CardAction.call(session, "skype:tanner_sac", "Un funcionario vía Skype"),
                // builder.CardAction.call(session, "tel:+56226389221", "Un funcionario vía telefónica"),
                // builder.CardAction.call(session, "mailto:sac@tanner.cl", "Contactar vía email"),
                builder.CardAction.openUrl(session, "https://www2.tanner.cl/servicio-al-cliente/preguntas-frecuentes/", "Visita nuestra FAQ en la web"),
            ]);
        var cardAtachment = new builder.Message(session)
            .addAttachment(card);

        session.send(cardAtachment);
    })
    .matches('qna', [
        function (session, args, next) {
            var answerEntity = builder.EntityRecognizer.findEntity(args.entities, 'answer');
            session.send(answerEntity.entity);
        }
    ])// Default
    .onDefault(function (session, results) {
        session.sendTyping();
        session.send('Hmmm... no pude comprender tu pregunta **"%s"**. Necesitas ayuda?', session.message.text);
    });

bot.dialog(intents.root, intent);

// Setup Restify Server
server.post('/api/messages', connector.listen());

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s escuchando %s', server.name, server.url);
});

//Validators
bot.library(require('./validators/validators'));
bot.library(require('./dialogs/cotizacion_credito'));
bot.library(require('./dialogs/solicitar_alzamiento'));
bot.library(require('./dialogs/solicitar_prepago'));
bot.library(require('./dialogs/solicitar_cert_deuda'));
bot.library(require('./dialogs/solicitar_cert_devolucion'));