export default class promptPrefix {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  set = (prefix: string) => {
    this.prefix = prefix;
  };

  get = () => {
    return this.prefix;
  };
}
