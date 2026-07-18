import type {Fact} from "@/networker/entity/graph/Fact";
import type {FunctionalCircle} from "@/networker/entity/graph/functionalCircle";
import type {Link} from "@/networker/entity/graph/link";
import type {Node} from "@/networker/entity/graph/node";
import type {NodeTypeCode} from "@/networker/entity/graph/nodeType";
import type {PcmEntity} from "@/networker/entity/graph/pcm";
import type {PcmHint} from "@/networker/entity/graph/pcmHint";
import type {Tag} from "@/networker/entity/graph/tag";

export type EntityId = number;

export interface FactDTO {
  id?: EntityId;
  uid?: string;
  description?: string;
}

export interface PcmDTO {
  filter?: PcmEntity['filter'];
}

export interface GraphNodeDTO {
  id?: EntityId;
  uid?: string;
  name?: string;
  description?: string;
  nodeType?: NodeTypeCode | null;
  facts?: FactDTO[];
  tags?: EntityId[];
  pcm?: PcmDTO;
  pcmHint?: PcmHint;
  fixed?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface GraphLinkDTO {
  id?: EntityId;
  uid?: string;
  source: EntityId | Node;
  target: EntityId | Node;
  distance?: number;
  status?: boolean;
  stroke?: string;
  strokeWidth?: number;
}

export interface FunctionalCircleDTO {
  id?: EntityId;
  uid?: string;
  nodeId?: EntityId;
  name?: string;
  r?: number;
  fill?: string;
  stroke?: string;
}

export interface TagDTO {
  id?: EntityId;
  uid?: string;
  name?: string;
  group?: string;
  color?: string;
}

export interface NetworkGraphDTO {
  nodes?: GraphNodeDTO[] | Node[];
  links?: GraphLinkDTO[] | Link[];
  circles?: FunctionalCircleDTO[] | FunctionalCircle[];
  tags?: TagDTO[] | Tag[];
}

export type GraphNodeCollection = Node[];
export type GraphLinkCollection = Link[];
export type FunctionalCircleCollection = FunctionalCircle[];
export type TagCollection = Tag[];
export type FactCollection = Fact[];
