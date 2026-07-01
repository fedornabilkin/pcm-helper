import MainEntity from "../../../core/builder/mainEntity";

export class PcmEntity extends MainEntity {
  constructor(config = {}) {
    super();
    Object.assign(this, config)
  }

  filter: any = {
    name: '',
    label: '',
    class: '',
    color: '',
  }
}