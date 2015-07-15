function CallbackFunction(callback, parameters) {
    this.Callback = callback;
    this.Parameters = parameters;
}

module.exports = CallbackFunction;