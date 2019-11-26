
export interface IXML {
  EnvioDTE: EnvioDTE;
}

interface EnvioDTE {
  ATTR: ATTR;
  SetDTE: SetDTE[];
  Personalizados: Personalizado[];
}

interface Personalizado {
  DocPersonalizado: DocPersonalizado[];
}

interface DocPersonalizado {
  ATTR: ATTR8;
  campoString: CampoString[];
  ImpresionDetalle: ImpresionDetalle[];
}

interface ImpresionDetalle {
  PersonNroLinDet: string[];
  DetPersonAFN_01: string[];
  DetPersonAFN_05: string[];
  DetPersonAFN_06: string[];
}

interface CampoString {
  ATTR: ATTR9;
  _?: string;
}

interface ATTR9 {
  name: string;
}

interface ATTR8 {
  dteID: string;
}

interface SetDTE {
  ATTR: ATTR2;
  Caratula: Caratula[];
  DTE: DTE[];
}

interface DTE {
  ATTR: ATTR3;
  Documento: Documento[];
  Signature: Signature[];
}

interface Signature {
  ATTR: ATTR5;
  SignedInfo: SignedInfo[];
  SignatureValue: string[];
  KeyInfo: KeyInfo[];
}

interface KeyInfo {
  KeyValue: KeyValue[];
  X509Data: X509Datum[];
}

interface X509Datum {
  X509Certificate: string[];
}

interface KeyValue {
  RSAKeyValue: RSAKeyValue[];
}

interface RSAKeyValue {
  Modulus: string[];
  Exponent: string[];
}

interface SignedInfo {
  CanonicalizationMethod: CanonicalizationMethod[];
  SignatureMethod: CanonicalizationMethod[];
  Reference: Reference[];
}

interface Reference {
  ATTR: ATTR7;
  Transforms: Transform[];
  DigestMethod: CanonicalizationMethod[];
  DigestValue: string[];
}

interface Transform {
  Transform: CanonicalizationMethod[];
}

interface ATTR7 {
  URI: string;
}

interface CanonicalizationMethod {
  ATTR: ATTR6;
}

interface ATTR6 {
  Algorithm: string;
}

interface ATTR5 {
  xmlns: string;
}

interface Documento {
  ATTR: ATTR2;
  Encabezado: Encabezado[];
  Detalle: Detalle[];
  TED: TED[];
  TmstFirma: string[];
}

interface TED {
  ATTR: ATTR3;
  DD: DD[];
  FRMT: FRMA[];
}

interface DD {
  RE: string[];
  TD: string[];
  F: string[];
  FE: string[];
  RR: string[];
  RSR: string[];
  MNT: string[];
  IT1: string[];
  CAF: CAF[];
  TSTED: string[];
}

interface CAF {
  ATTR: ATTR3;
  DA: DA[];
  FRMA: FRMA[];
}

interface FRMA {
  _: string;
  ATTR: ATTR4;
}

interface ATTR4 {
  algoritmo: string;
}

interface DA {
  RE: string[];
  RS: string[];
  TD: string[];
  RNG: RNG[];
  FA: string[];
  RSAPK: RSAPK[];
  IDK: string[];
}

interface RSAPK {
  M: string[];
  E: string[];
}

interface RNG {
  D: string[];
  H: string[];
}

interface Detalle {
  NroLinDet: string[];
  CdgItem: CdgItem[];
  NmbItem: string[];
  QtyItem: string[];
  UnmdItem: string[];
  PrcItem: string[];
  MontoItem: string[];
}

interface CdgItem {
  TpoCodigo: string[];
  VlrCodigo: string[];
}

interface Encabezado {
  IdDoc: IdDoc[];
  Emisor: Emisor[];
  Receptor: Receptor[];
  Totales: Totale[];
}

interface Totale {
  MntNeto: string[];
  MntExe: string[];
  TasaIVA: string[];
  IVA: string[];
  MntTotal: string[];
}

interface Receptor {
  RUTRecep: string[];
  RznSocRecep: string[];
  GiroRecep: string[];
  DirRecep: string[];
  CmnaRecep: string[];
  CiudadRecep: string[];
}

interface Emisor {
  RUTEmisor: string[];
  RznSoc: string[];
  GiroEmis: string[];
  Acteco: string[];
  DirOrigen: string[];
  CmnaOrigen: string[];
  CiudadOrigen: string[];
}

interface IdDoc {
  TipoDTE: string[];
  Folio: string[];
  FchEmis: string[];
  TipoDespacho: string[];
  IndTraslado: string[];
  FmaPago: string[];
  FchVenc: string[];
}

interface Caratula {
  ATTR: ATTR3;
  RutEmisor: string[];
  RutEnvia: string[];
  RutReceptor: string[];
  FchResol: string[];
  NroResol: string[];
  TmstFirmaEnv: string[];
  SubTotDTE: SubTotDTE[];
}

interface SubTotDTE {
  TpoDTE: string[];
  NroDTE: string[];
}

interface ATTR3 {
  version: string;
}

interface ATTR2 {
  ID: string;
}

interface ATTR {
  version: string;
  xmlns: string;
  'xmlns:xsi': string;
  'xsi:schemaLocation': string;
}
