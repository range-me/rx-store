import R from "ramda";
import Rx from "rx";

function capitalize(name) {
  return name[0].toUpperCase() + name.substr(1);
}

function method(prefix, name) {
  let capitalizedName = capitalize(name);
  return `${prefix}${capitalizedName}`;
}

const inputMethodName = R.partial(method, ["onChange"]);
const intentMethodName = R.partial(method, ["on"]);
const rxMethodName = R.partial(method, ["rx"]);

function rxIntentMethodName(name) {
  return rxMethodName(name) + "Intent";
}

function setupIntent(intent) {
  this[rxIntentMethodName(intent)] = R.always(new Rx.Subject());
}

function setupInput(input) {
  let subject = new Rx.BehaviorSubject();

  if (this.state[input] !== undefined) {
    subject.onNext(this.state[input]);
  }

  this[rxMethodName(input)] = () => subject.distinctUntilChanged();
  this.__rx.__inputs[input] = subject;
}

function setupRx() {
  this.__rx.__inputs = {};
  R.forEach(setupIntent.bind(this), this.__rx.intents);
  R.forEach(setupInput.bind(this), this.__rx.inputs);
  this.rxState().subscribe(this.setState.bind(this));

  return this;
}

class Store {
  constructor() {
    this.__rx = {
      inputs: [],
      intents: []
    };

    this.state = {};
    this.rx = R.memoize(setupRx.bind(this));
  }

  inputs(...names) {
    this.__rx.inputs = names;

    R.forEach(
      (name) => {
        this[inputMethodName(name)] = (value) => {
          this.rx().__rx.__inputs[name].onNext(value);
        };
      },
      names
    );
  }

  intents(...names) {
    this.__rx.intents = names;

    R.forEach(
      (name) => {
        let intentMethod = intentMethodName(name);
        let rxMethod = rxIntentMethodName(name);

        this[intentMethod] = (data = true) => {
          this.rx()[rxMethod]().onNext(data);
        };
      },
      names
    );
  }
}

export default Store;
