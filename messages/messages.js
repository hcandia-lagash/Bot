
var Saludar = function(session){
    return 'Bienvenido al BOT de autoatención de Tanner Automotriz.\nEn cualquier momento puedes solicitarme asistencia ingresando la palabra "ayuda".';
}

var SolicitarRut = function(session){
    return 'Para realizar la acción solicitada necesito conocer tu RUT. ¿Podrías indicarmelo?'; 
}

var CotizarCredito = function(session){
    return 'Claro! Para cotizar un crédito debo solicitarte algunos datos.';
}

var ValorVehiculo = function(session){
    return '¿Puedes indicarme el valor del vehículo?';
}

var OfrecerAyuda = function(){
    return '¿Puedo ayudarte en algo más?';
}

module.exports = {
    Saludar : Saludar,
    SolicitarRut : SolicitarRut,
    CotizarCredito : CotizarCredito,
    OfrecerAyuda : OfrecerAyuda
}