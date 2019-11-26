import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as xml2js from 'xml2js';
import { IXML } from '../interfaces';
import EscPosEncoder from 'esc-pos-encoder-ionic';

import { createCanvas } from 'canvas';
import PDF417 from 'pdf417-generator';

const canvas = createCanvas(200, 200);

@Injectable({
  providedIn: 'root'
})
export class XmlService {

    invoiceData: any;

    wrap = 80;
    margenLeft = [ 32 ];
    margenLeftSubItem = [ 32, 32, 32, 32];
    margenRight = [ 32, 32, 32, 32, 32, 32];
    detalleLength = 36;
    borderLine = [223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223,
                  223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223,  223, 223, 223, 223,
                  223, 223, 223, 223, 223, 223, 223, 223, 223, 223,  223, 223, 223, 223,  223, 223, 223,
                  223, 223, 223, 223, 223, 223, 223, 223, 223, 223,  223, 223, 223
                ];

    constructor( private http: HttpClient) { }

    getXML() {

        return new Promise( (resolve) => {

            const headers = new HttpHeaders()
                .set('Content-Type', 'text/xml')
                .append('Access-Control-Allow-Methods', 'GET')
                .append('Access-Control-Allow-Origin', '*')
                .append('Access-Control-Allow-Headers',
                    'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method');

            this.http.get('/assets/xml/GuiaDespacho.xml', { headers, responseType: 'text'} ).subscribe(

                (data) => {

                    resolve(data);
                },

                (err) => {
                    console.log(err);
                }
            );
        });
    }

    getXMLAssets( url: string ) {

        return new Promise( (resolve) => {

            const headers = new HttpHeaders()
                .set('Content-Type', 'text/xml')
                .append('Access-Control-Allow-Methods', 'GET')
                .append('Access-Control-Allow-Origin', '*')
                .append('Access-Control-Allow-Headers',
                    'Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method');

            this.http.get(`${ url }`, { headers, responseType: 'text'} ).subscribe(

                (data) => {

                    resolve(data);
                },

                (err) => {
                    console.log(err);
                }
            );
        });
    }

    async fragmentarXMLAsset( xml: string, url: string ) {

        return new Promise ( async resolve => {

            const invoiceData: any = {};

            // With parser
            const parser = new xml2js.Parser( { attrkey: 'ATTR' } );

            const stringXML = (xml !== '' ) ? xml : await this.getXMLAssets( url );
            // const stringXML = await this.getXMLAssets( url );

            parser.parseString(stringXML, async (error: any, result: IXML) => {

                if ( error ) {
                    console.log(error);
                    throw error;
                }

                invoiceData.TED = result.EnvioDTE.SetDTE[0].DTE[0].Documento[0].TED[0];

                const Documento = result.EnvioDTE.SetDTE[0].DTE[0].Documento[0];
                const SetDTE = result.EnvioDTE.SetDTE[0];
                const Encabezado = Documento.Encabezado[0];
                const Detalles = Documento.Detalle;
                const Emisor = Encabezado.Emisor[0];
                const Receptor = Encabezado.Receptor[0];
                const Totales = Encabezado.Totales[0];

                const direccion = `${Emisor.DirOrigen[0]}, ${Emisor.CmnaOrigen[0]},  ${Emisor.CiudadOrigen[0]}`;
                const IdDoc = Encabezado.IdDoc[0];

                invoiceData.fechaResol = SetDTE.Caratula[0].FchResol[0];
                invoiceData.numeroResol = SetDTE.Caratula[0].NroResol[0];

                invoiceData.tipoDespacho = IdDoc.TipoDespacho ? IdDoc.TipoDespacho[0] : '';

                invoiceData.indTraslado = IdDoc.IndTraslado[0];

                invoiceData.montoTotal = Totales.MntTotal[0];

                invoiceData.montoIVA = Totales.IVA[0];

                invoiceData.montoNeto = Totales.MntNeto[0];

                invoiceData.detalle = [];

                Detalles.forEach( detalle => {

                    invoiceData.detalle.push( {
                        nombreItem: detalle.NmbItem[0],
                        cantidadItem: detalle.QtyItem[0],
                        unidadItem: detalle.UnmdItem[0],
                        precioItem: detalle.PrcItem[0],
                        montoItem: detalle.MontoItem[0]
                    });
                });

                invoiceData.ciudadDestino = 'Averiguar';

                invoiceData.cmnaRecep = Receptor.CmnaRecep[0];

                invoiceData.ciudadRecep = Receptor.CiudadRecep ? Receptor.CiudadRecep[0] : '';

                invoiceData.dirRecep = Receptor.DirRecep[0];

                invoiceData.giroRecep = Receptor.GiroRecep[0];

                invoiceData.rznSocReceptor = Receptor.RznSocRecep[0];

                invoiceData.receptor = Receptor.RUTRecep[0];

                invoiceData.fechaEmision = IdDoc.FchEmis[0];

                invoiceData.direccion = direccion;

                invoiceData.rznSoc = Emisor.RznSoc[0];

                invoiceData.ciudadOrigen = Emisor.CiudadOrigen ? Emisor.CiudadOrigen[0] : '';

                invoiceData.rut = Documento.TED[0].DD[0].RE[0];

                invoiceData.folio = Encabezado.IdDoc[0].Folio[0];

                resolve( invoiceData );
            });
        });
    }

    async invoicedAsset( xml: string, url: string) {

        return new Promise ( async resolve => {

            const invoiceData: any = await this.fragmentarXMLAsset( xml, url );

            const encoder = new EscPosEncoder();
            const wrap = 80;
            const margenLeft = [ 32, 32, 32, 32];
            const margenLeftSubItem = [ 32, 32, 32, 32, 32, 32];
            const margenRight = [ 32, 32, 32, 32, 32, 32];
            const detalleLength = 36;


            const subDetalle = this.recortarPalabra('CANTIDAD x PRECIO', 36);
            const subUnidad = this.recortarPalabra('MEDIDA', 35);

            let nombreItem;
            let unidadItem;
            let cantidadItem;
            let precioItem;
            let montoItem;

            invoiceData.detalle.map( (detalle: any) => {

                nombreItem = detalle.nombreItem;
                unidadItem = detalle.unidadItem;
                cantidadItem = this.number_format(detalle.cantidadItem, 2, ',', '.');
                precioItem = this.number_format(detalle.precioItem, 2, ',', '.');
                montoItem = detalle.montoItem;  // this.number_format(detalle.montoItem, 2, ',', '.');
            });

            nombreItem = this.recortarPalabra(nombreItem, 36);
            unidadItem = this.recortarPalabra(unidadItem, 35);
            montoItem = this.recortarPalabra(montoItem, 7);

            const subItem = this.recortarPalabra(`${cantidadItem} x ${precioItem} c/u`, 36);

            // const result = encoder
            //     .align('center')
            //     .underline(false)
            //     .size('normal')

            //     .bold(true)
            //     .line(`R.U.T.: ${ invoiceData.rut }`, wrap)
            //     .bold(false)
            //     .newline()

            //     .line('GUIA DE DESPACHO', wrap)
            //     .line('ELECTRONICA', wrap)
            //     .newline()

            //     .bold(true)
            //     .line(`Nro ${ invoiceData.folio }`, wrap)
            //     .bold(false)
            //     .newline()

            //     .size('small')
            //     .line('S.I.I. SANTIAGO ORIENTE ', wrap)

            //     .bold(true)
            //     .line(`${ invoiceData.rznSoc }`, wrap)
            //     .newline()

            //     .bold(false)
            //     .align('left')

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`CASA MATRIZ: `, 20)
            //     .bold(false)
            //     .text(`${invoiceData.direccion }`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`GIRO: `, 20)
            //     .bold(false)
            //     .text(`${ invoiceData.giroRecep }`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`FECHA EMISION: `, 20)
            //     .bold(false)
            //     .text(`${ invoiceData.fechaEmision }`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`DIRECCION SUCURSA: `, 20)
            //     .bold(false)
            //     .text(``, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`TIENDA: `, 20)
            //     .bold(false)
            //     .text(``, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`CAJEROA: `, 20)
            //     .bold(false)
            //     .text(``, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`NRO. TRANSACCION: `, 20)
            //     .bold(false)
            //     .text(``, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`RUT CLIENTE: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.receptor}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`NOMBRE CLIENTE: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.rznSocReceptor}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`GIRO: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.giroRecep}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`DIRECCION: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.dirRecep}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`COMUNA: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.cmnaRecep}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`CIUDAD: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.ciudadOrigen}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`CIUDAD DESTINO: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.ciudadRecep}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`TIPO TRASLADO: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.indTraslado}`, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`TRANSPORTISTA: `, 20)
            //     .bold(false)
            //     .text(` `, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`ODOMETRO: `, 20)
            //     .bold(false)
            //     .text(` `, wrap)
            //     .newline()

            //     .bold(true)
            //     .raw(margenLeft)
            //     .text(`TIPO DESPACHO: `, 20)
            //     .bold(false)
            //     .text(` ${invoiceData.tipoDespacho}`, wrap)
            //     .newline()

            //     .align('center')
            //     .line(`Detalle                              UNIDAD                              VALOR`, wrap)
            //     .line(`${subDetalle} ${subUnidad} VALOR`, wrap)
            //     .newline()

            //     .line(`${nombreItem} ${unidadItem} ${montoItem}`, wrap)

            //     .align('left')
            //     .raw(margenLeftSubItem)
            //     .line(`${subItem}`, wrap)

            //     .align('center')
            //     .barcode('3130630574613', 'ean13', 60)
            //     .newline()

            //     .raw(margenLeft)
            //     .line(`Timbre Electronico SII`, wrap)
            //     .raw(margenLeft)
            //     .line(`Res. ${invoiceData.numeroResol} del ${invoiceData.fechaResol}`, wrap)
            //     .raw(margenLeft)
            //     .line(`Verifique documento www.sii.cl`, wrap)
            //     .encode();


            const result = encoder
                .align('center')
                .line(`Timbre Electronico SII`, wrap)
                .encode();

            return resolve( result );
        });
    }





    private async cuerpoInvoice( xml: string, url?: string ) {
        return new Promise ( async resolve => {

            this.invoiceData = await this.fragmentarXMLAsset( xml, url );

            const encoder = new EscPosEncoder();

            const subDetalle = this.recortarPalabra('CANTIDAD x PRECIO', 28);
            const subUnidad = this.recortarPalabra('MEDIDA', 27);

            const RUT = this.recortarPalabra(`R.U.T.: ${ this.invoiceData.rut }`, 32);

            const result = encoder
                .align('center')
                .underline(false)
                .size('normal')

                .raw([223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223,
                  223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223,  223, 223, 223, 223])
                .newline()

                .bold(true)
                // .text(`${RUT}H`, this.wrap)
                // .text(`R.U.T.: ${ this.invoiceData.rut }`, this.wrap)
                // .raw([32, 219])
                .line(`R.U.T.: ${ this.invoiceData.rut }`, this.wrap)
                .bold(false)
                .newline()

                .text(`GUIA DE DESPACHO`, this.wrap)
                // .raw([32, 32, 32, 219])
                .newline()
                // .line('GUIA DE DESPACHO', this.wrap)
                .line('ELECTRONICA', this.wrap)
                .newline()

                .bold(true)
                .line(`Nro ${ this.invoiceData.folio }`, this.wrap)
                .bold(false)
                .raw([223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223,
                  223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223, 223,  223, 223, 223, 223])
                .newline()

                .size('small')
                .line('S.I.I. SANTIAGO ORIENTE ', this.wrap)

                .bold(true)
                .line(`${ this.invoiceData.rznSoc }`, this.wrap)
                .newline()

                .bold(false)
                .align('left')

                .bold(true)
                // .raw(this.margenLeft)
                .text(`CASA MATRIZ: `, 20)
                .bold(false)
                .text(`${this.invoiceData.direccion }`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`GIRO: `, 20)
                .bold(false)
                .text(`${ this.invoiceData.giroRecep }`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`FECHA EMISION: `, 20)
                .bold(false)
                .text(`${ this.invoiceData.fechaEmision }`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`DIRECCION SUCURSA: `, 20)
                .bold(false)
                .text(``, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`TIENDA: `, 20)
                .bold(false)
                .text(``, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`CAJEROA: `, 20)
                .bold(false)
                .text(``, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`NRO. TRANSACCION: `, 20)
                .bold(false)
                .text(``, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`RUT CLIENTE: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.receptor}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`NOMBRE CLIENTE: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.rznSocReceptor}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`GIRO: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.giroRecep}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`DIRECCION: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.dirRecep}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`COMUNA: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.cmnaRecep}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`CIUDAD: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.ciudadOrigen}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`CIUDAD DESTINO: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.ciudadRecep}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`TIPO TRASLADO: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.indTraslado}`, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`TRANSPORTISTA: `, 20)
                .bold(false)
                .text(` `, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`ODOMETRO: `, 20)
                .bold(false)
                .text(` `, this.wrap)
                .newline()

                .bold(true)
                // .raw(this.margenLeft)
                .text(`TIPO DESPACHO: `, 20)
                .bold(false)
                .text(` ${this.invoiceData.tipoDespacho}`, this.wrap)
                .newline()

                .align('center')
                .raw(this.borderLine)
                .newline()

                .line(`Detalle                      UNIDAD                      VALOR`, this.wrap)
                .line(`${subDetalle} ${subUnidad} VALOR`, this.wrap)
                .raw(this.borderLine)
                .newline()
                .encode();

            return resolve( result );
        });
    }

    private async detalleInvoice() {
        return new Promise ( async resolve => {

            const encoder = new EscPosEncoder();
            let result: any;
            const formatoDetalle = [];
            let nombreItem;
            let unidadItem;
            let cantidadItem;
            let precioItem;
            let montoItem;
            let subItem;

            await this.invoiceData.detalle.map( (detalle: any) => {

                nombreItem = detalle.nombreItem;
                unidadItem = detalle.unidadItem;
                cantidadItem = this.number_format(detalle.cantidadItem, 2, ',', '.');
                precioItem = this.number_format(detalle.precioItem, 2, ',', '.');
                montoItem = detalle.montoItem;

                nombreItem = this.recortarPalabra(nombreItem, 32);
                unidadItem = this.recortarPalabra(unidadItem, 23);
                montoItem = this.recortarPalabra(montoItem, 7);

                subItem = this.recortarPalabra(`${cantidadItem} x ${precioItem} c/u`, 36);

                result = encoder
                    .line(`${nombreItem} ${unidadItem} ${montoItem}`, this.wrap)
                    .align('left')
                    .raw(this.margenLeftSubItem)
                    .line(`${subItem}`, this.wrap)
                    .encode();

                formatoDetalle.push( result );
            });

            const totalNetoString = this.recortarPalabra('TOTAL NETO', 32);
            const totalNetoSimbolo = this.recortarPalabra('$', 23);
            const totalNetoValor = this.recortarPalabra(this.invoiceData.montoNeto, 7);

            const montoIVAString = this.recortarPalabra('TOTAL IVA', 32);
            const montoIVASimbolo = this.recortarPalabra('$', 23);
            const montoIVAValor = this.recortarPalabra(this.invoiceData.montoIVA, 7);

            const montoTotalString = this.recortarPalabra('TOTAL', 32);
            const montoTotalSimbolo = this.recortarPalabra('$', 23);
            const montoTotalValor = this.recortarPalabra(this.invoiceData.montoTotal, 7);

            result = encoder
                .align('center')
                .raw(this.borderLine)
                .newline()
                .align('left')
                .line(`${totalNetoString} ${totalNetoSimbolo} ${totalNetoValor}`, this.wrap)
                .line(`${montoIVAString} ${montoIVASimbolo} ${montoIVAValor}`, this.wrap)
                .line(`${montoTotalString} ${montoTotalSimbolo} ${montoTotalValor}`, this.wrap)
                .align('center')
                .raw(this.borderLine)
                .newline()
                .encode();

            formatoDetalle.push( result );

            resolve( formatoDetalle );
        });
    }

    private barcodePDF417() {

        return new Promise ( resolve => {

            const TED = this.invoiceData.TED;

            // console.log(this.invoiceData);

            //     const barcode = `
            //     <TED version="${TED.ATTR.version}">
            //         <DD>
            //             <RE>${ TED.DD[0].RE[0] }</RE>
            //             <TD>${ TED.DD[0].TD[0]}</TD>
            //             <F>${ TED.DD[0].F[0] }</F>
            //             <FE>${ TED.DD[0].FE[0] }</FE>
            //             <RR>${ TED.DD[0].RR[0] }</RR>
            //             <RSR>${ TED.DD[0].RSR[0] }</RSR>
            //             <MNT>${ TED.DD[0].MNT[0] }</MNT>
            //             <IT1>${ TED.DD[0].IT1[0] }</IT1>
            //             <CAF version="${ TED.DD[0].CAF[0].ATTR.version[0]}" >
            //                 <DA>
            //                     <RE> ${ TED.DD[0].CAF[0].DA[0].RE[0] } </RE>
            //                     <RS> ${ TED.DD[0].CAF[0].DA[0].RS[0] } </RS>
            //                     <TD> ${ TED.DD[0].CAF[0].DA[0].TD[0] } </TD>
            //                     <RNG>
            //                         <D> ${ TED.DD[0].CAF[0].DA[0].RNG[0].D[0]} </D>
            //                         <H> ${ TED.DD[0].CAF[0].DA[0].RNG[0].H[0] } </H>
            //                     </RNG>
            //                     <FA> ${ TED.DD[0].CAF[0].DA[0].FA[0] } </FA>
            //                     <RSAPK>
            //                         <M> ${ TED.DD[0].CAF[0].DA[0].RSAPK[0].M[0] } </M>
            //                         <E> ${ TED.DD[0].CAF[0].DA[0].RSAPK[0].E[0] } </E>
            //                     </RSAPK>
            //                     <IDK> ${ TED.DD[0].CAF[0].DA[0].IDK[0] } </IDK>
            //                 </DA>
            //                 <FRMA> ${ TED.DD[0].CAF[0].FRMA[0]._ } </FRMA>
            //             </CAF>
            //             <TSTED> ${ TED.DD[0].TSTED[0] }  </TSTED>
            //         </DD>
            //         <FRMT algoritmo="${ TED.FRMT[0].ATTR.algoritmo }" >  ${ TED.FRMT[0]._ } </FRMT>
            //     </TED>
            // `;

            // tslint:disable-next-line: max-line-length
            const code = `<TED version="${TED.ATTR.version}"><DD> <RE>${ TED.DD[0].RE[0] }</RE> <TD>${ TED.DD[0].TD[0]}</TD> <F>${ TED.DD[0].F[0] }</F> <FE>${ TED.DD[0].FE[0] }</FE> <RR>${ TED.DD[0].RR[0] }</RR> <RSR>${ TED.DD[0].RSR[0] }</RSR> <MNT>${ TED.DD[0].MNT[0] }</MNT> <IT1>${ TED.DD[0].IT1[0] }</IT1><CAF version="${ TED.DD[0].CAF[0].ATTR.version[0]}" ><DA> <RE> ${ TED.DD[0].CAF[0].DA[0].RE[0] } </RE> <RS> ${ TED.DD[0].CAF[0].DA[0].RS[0] } </RS> <TD> ${ TED.DD[0].CAF[0].DA[0].TD[0] } </TD><RNG> <D> ${ TED.DD[0].CAF[0].DA[0].RNG[0].D[0]} </D> <H> ${ TED.DD[0].CAF[0].DA[0].RNG[0].H[0] } </H></RNG><FA> ${ TED.DD[0].CAF[0].DA[0].FA[0] } </FA><RSAPK> <M> ${ TED.DD[0].CAF[0].DA[0].RSAPK[0].M[0] } </M> <E> ${ TED.DD[0].CAF[0].DA[0].RSAPK[0].E[0] } </E> </RSAPK><IDK> ${ TED.DD[0].CAF[0].DA[0].IDK[0] } </IDK></DA><FRMA> ${ TED.DD[0].CAF[0].FRMA[0]._ } </FRMA></CAF><TSTED> ${ TED.DD[0].TSTED[0] }  </TSTED></DD><FRMT algoritmo="${ TED.FRMT[0].ATTR.algoritmo }" >  ${ TED.FRMT[0]._ } </FRMT</TED>`;

            // console.log(code);

            const encoder = new EscPosEncoder();

            PDF417.draw(code, canvas);

            const img = new Image();
            img.src = canvas.toDataURL();

            img.onload =  async () => {
                const barcode = await encoder
                    .align('center')
                    .image(img, 360, 120, 'atkinson', 128)
                    .newline()
                    .encode();

                resolve( barcode );
            };

        });
    }

    private async footerInvoice() {
        return new Promise( resolve => {
            const encoder = new EscPosEncoder();

            const result = encoder
                .align('center')
                // .raw(this.margenLeft)
                .line(`Timbre Electronico SII`, this.wrap)
                // .raw(this.margenLeft)
                .line(`Res. ${this.invoiceData.numeroResol} del ${this.invoiceData.fechaResol}`, this.wrap)
                // .raw(this.margenLeft)
                .line(`Verifique documento www.sii.cl`, this.wrap)
                .encode();

            resolve( result );
        });
    }

    async invoiceStructura( xml: string, url: string ) {

        return new Promise( async resolve => {

            const invoice = {
                cuerpo: [],
                detalle: [],
                barcode: [],
                footer: []
            };

            invoice.cuerpo.push( await this.cuerpoInvoice( xml, url ) );

            invoice.detalle.push( await this.detalleInvoice() );

            invoice.barcode.push( await this.barcodePDF417() );

            invoice.footer.push( await this.footerInvoice() );

            resolve ( invoice );
        } );
    }






    private recortarPalabra( palabra: string, longitud: number ) {

        let cortada = palabra.substr(0, 36);

        if ( cortada.length < longitud ) {

            for (let index = cortada.length; index <= (longitud - 1); index++) {

                cortada += ' ';
            }
        }

        return cortada;
    }

    // tslint:disable-next-line: variable-name
    private number_format(number: any, decimals: any, dec_point: any, thousands_point: any) {

        if (number == null || !isFinite(number)) {
            throw new TypeError('number is not valid');
        }

        if (!decimals) {
            const len = number.toString().split('.').length;
            decimals = len > 1 ? len : 0;
        }

        if (!dec_point) {
            dec_point = '.';
        }

        if (!thousands_point) {
            thousands_point = ',';
        }

        number = parseFloat(number).toFixed(decimals);

        number = number.replace('.', dec_point);

        const splitNum = number.split(dec_point);
        splitNum[0] = splitNum[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands_point);
        number = splitNum.join(dec_point);

        return number;
    }

    test( stringXML: string ) {
        // With parser
        const parser = new xml2js.Parser( { attrkey: 'ATTR' } );

        parser.parseString(stringXML, async (error: any, result: IXML) => {

            if ( error ) {
                console.log(error);
                throw error;
            }

            console.log(result);
        });
    }
}
