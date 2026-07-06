export type NodeTypeCode = 'connector' | 'condenser' | 'bridge' | 'gatekeeper';

export interface NodeTypeOption {
  code: NodeTypeCode;
  label: string;
  color: string;
  buttonClass: string;
  iconKind: NodeTypeCode;
  iconClass?: string;
}

export const NODE_TYPE_OPTIONS: NodeTypeOption[] = [
  {
    code: 'connector',
    label: 'Коннектор',
    color: '#2874d0',
    buttonClass: 'is-info',
    iconKind: 'connector',
  },
  {
    code: 'condenser',
    label: 'Конденсатор',
    color: '#9d6436',
    buttonClass: '',
    iconKind: 'condenser',
  },
  {
    code: 'bridge',
    label: 'Мост',
    color: '#9d3cf1',
    buttonClass: 'is-link',
    iconKind: 'bridge',
    iconClass: 'fa-bridge',
  },
  {
    code: 'gatekeeper',
    label: 'Привратник',
    color: '#d84c4c',
    buttonClass: 'is-danger',
    iconKind: 'gatekeeper',
    iconClass: 'fa-shield-halved',
  },
]

export const getNodeTypeOption = (code?: NodeTypeCode | null): NodeTypeOption | undefined => {
  return NODE_TYPE_OPTIONS.find(option => option.code === code)
}
