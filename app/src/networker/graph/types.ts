import type {Fact} from "@/networker/entity/graph/Fact";
import type {FunctionalCircle} from "@/networker/entity/graph/functionalCircle";
import type {Link} from "@/networker/entity/graph/link";
import type {Node} from "@/networker/entity/graph/node";
import type {PcmEntity} from "@/networker/entity/graph/pcm";
import type {Tag} from "@/networker/entity/graph/tag";

export type EntityId = number;

export interface FactDTO {
  id?: EntityId;
  description?: string;
}

export interface PcmDTO {
  filter?: PcmEntity['filter'];
}

export interface GraphNodeDTO {
  id?: EntityId;
  name?: string;
  description?: string;
  facts?: FactDTO[];
  tags?: EntityId[];
  pcm?: PcmDTO;
  fixed?: boolean;
  fx?: number | null;
  fy?: number | null;
  fill?: string;
}

export interface GraphLinkDTO {
  id?: EntityId;
  source: EntityId | Node;
  target: EntityId | Node;
  distance?: number;
  status?: boolean;
  stroke?: string;
  strokeWidth?: number;
}

export interface FunctionalCircleDTO {
  id?: EntityId;
  name?: string;
  r?: number;
}

export interface TagDTO {
  id?: EntityId;
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
