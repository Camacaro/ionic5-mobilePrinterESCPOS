import { Component, OnInit } from '@angular/core';
import * as xml2js from 'xml2js';
import { XmlService } from '../../services/xml.service';
import { IXML } from 'src/app/interfaces';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

    XMLEstaticos = [
        {
            nombre: 'Aceptado',
            url: '/assets/xml/Aceptado.xml',
            select: false
        },
        {
            nombre: 'Aceptado con Reparos',
            url: '/assets/xml/AceptadoConReparos.xml',
            select: false
        },
        {
            nombre: 'Enviado al SII',
            url: '/assets/xml/EnviadoAlSII.xml',
            select: false
        },
        {
            nombre: 'No Enviado a SII',
            url: '/assets/xml/NoEnviadoASII.xml',
            select: false
        },
        {
            nombre: 'Guia Despacho',
            url: '/assets/xml/GuiaDespacho.xml',
            select: true
        }
    ];

    invoiceData: any = {};

    constructor(
        private xmlService: XmlService
    ) {}

    ngOnInit() {
        // this.fragmentarXML();

        this.XMLEstaticos.forEach( ruta => {
            this.fragmentarXMLAsset( ruta.url );
        });
    }

    async fragmentarXML() {
        // With parser
        const parser = new xml2js.Parser( { attrkey: 'ATTR' } );

        const stringXML = await this.xmlService.getXML();

        // var cleanedString = XML.replace("\ufeff", "");


        parser.parseString(stringXML, async (error: any, result: IXML) => {

            if ( error ) {
                console.log(error);
            }

            const Documento = result.EnvioDTE.SetDTE[0].DTE[0].Documento[0];
            const Encabezado = Documento.Encabezado[0];
            const Detalles = Documento.Detalle;
            const Emisor = Encabezado.Emisor[0];
            const Receptor = Encabezado.Receptor[0];
            const Totales = Encabezado.Totales[0];

            const direccion = `${Emisor.DirOrigen[0]}, ${Emisor.CmnaOrigen[0]},  ${Emisor.CiudadOrigen[0]}`;
            const IdDoc = Encabezado.IdDoc[0];

            // const campoString = result.EnvioDTE.Personalizados[0].DocPersonalizado[0].campoString;
            // let fechaEmision: any = campoString.filter( campo => {
            //     return ( campo.ATTR.name === 'Fecha_Emision' ) ;
            // }); // [0]._

            // fechaEmision = ( fechaEmision.length === 0 ) ? '' : fechaEmision[0]._;

            // console.log( fechaEmision );

            this.invoiceData.montoTotal = Totales.MntTotal[0];

            this.invoiceData.montoIVA = Totales.IVA[0];

            this.invoiceData.montoNeto = Totales.MntNeto[0];

            this.invoiceData.detalle = [];

            Detalles.forEach( detalle => {

                this.invoiceData.detalle.push( {
                    nombreItem: detalle.NmbItem[0],
                    cantidadItem: detalle.QtyItem[0],
                    unidadItem: detalle.UnmdItem[0],
                    precioItem: detalle.PrcItem[0],
                    montoItem: detalle.MontoItem[0]
                });
            });

            this.invoiceData.ciudadDestino = 'Averiguar';

            this.invoiceData.cmnaRecep = Receptor.CmnaRecep[0];

            this.invoiceData.ciudadRecep = Receptor.CiudadRecep[0];

            this.invoiceData.dirRecep = Receptor.DirRecep[0];

            this.invoiceData.giroRecep = Receptor.GiroRecep[0];

            this.invoiceData.rznSocReceptor = Receptor.RznSocRecep[0];

            this.invoiceData.receptor = Receptor.RUTRecep[0];

            this.invoiceData.fechaEmision = IdDoc.FchEmis[0];

            this.invoiceData.direccion = direccion;

            this.invoiceData.rznSoc = Emisor.RznSoc[0];

            this.invoiceData.rut = Documento.TED[0].DD[0].RE[0];

            this.invoiceData.folio = Encabezado.IdDoc[0].Folio[0];

            // this.invoiceData.folio = Encabezado.IdDoc[0].Folio[0];
        });

        console.log( this.invoiceData );

        // await parser.parseStringPromise( XML )
        // .then(
        //     resul => {
        //         console.dir(resul);
        //         console.log('Done');
        //     }
        // )
        // .catch(
        //     err => {
        //         console.log(err);
        //     }
        // );
    }

    async fragmentarXMLAsset( url: string ) {
        // With parser
        const parser = new xml2js.Parser( { attrkey: 'ATTR' } );

        const stringXML = await this.xmlService.getXMLAssets( url );

        parser.parseString(stringXML, async (error: any, result: IXML) => {

            if ( error ) {
                console.log(error);
            }

            const Documento = result.EnvioDTE.SetDTE[0].DTE[0].Documento[0];
            const Encabezado = Documento.Encabezado[0];
            const Detalles = Documento.Detalle;
            const Emisor = Encabezado.Emisor[0];
            const Receptor = Encabezado.Receptor[0];
            const Totales = Encabezado.Totales[0];

            const direccion = `${Emisor.DirOrigen[0]}, ${Emisor.CmnaOrigen[0]},  ${Emisor.CiudadOrigen[0]}`;
            const IdDoc = Encabezado.IdDoc[0];

            this.invoiceData.montoTotal = Totales.MntTotal[0];

            this.invoiceData.montoIVA = Totales.IVA[0];

            this.invoiceData.montoNeto = Totales.MntNeto[0];

            this.invoiceData.detalle = [];

            Detalles.forEach( detalle => {

                this.invoiceData.detalle.push( {
                    nombreItem: detalle.NmbItem[0],
                    cantidadItem: detalle.QtyItem[0],
                    unidadItem: detalle.UnmdItem[0],
                    precioItem: detalle.PrcItem[0],
                    montoItem: detalle.MontoItem[0]
                });
            });

            this.invoiceData.ciudadDestino = 'Averiguar';

            this.invoiceData.cmnaRecep = Receptor.CmnaRecep[0];

            this.invoiceData.ciudadRecep = Receptor.CiudadRecep ? Receptor.CiudadRecep[0] : '';

            this.invoiceData.dirRecep = Receptor.DirRecep[0];

            this.invoiceData.giroRecep = Receptor.GiroRecep[0];

            this.invoiceData.rznSocReceptor = Receptor.RznSocRecep[0];

            this.invoiceData.receptor = Receptor.RUTRecep[0];

            this.invoiceData.fechaEmision = IdDoc.FchEmis[0];

            this.invoiceData.direccion = direccion;

            this.invoiceData.rznSoc = Emisor.RznSoc[0];

            this.invoiceData.rut = Documento.TED[0].DD[0].RE[0];

            this.invoiceData.folio = Encabezado.IdDoc[0].Folio[0];
        });

        console.log( this.invoiceData );
    }

    elegirXML( index ) {
        console.log(index);
    }
}
