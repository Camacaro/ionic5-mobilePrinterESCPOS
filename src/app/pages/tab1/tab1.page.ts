import { Component } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { UiService } from '../../services/ui.service';
import { XmlService } from '../../services/xml.service';

interface IPairedlist {
  'class': number;
  'id': string;
  'address': string;
  'name': string;
}

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})

export class Tab1Page {

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

    XMLInput = '';

    indexXML = 4;

    dispositivos: IPairedlist;

    listToggle = false;
    dispositivoID = 0;

    txt = '';

    constructor(
        private bluetoothSerial: BluetoothSerial,
        private uiService: UiService,
        private xmlService: XmlService
    ) {}


    checkBluetoothEnabled() {
        this.bluetoothSerial.isEnabled().then(
            success => {
                this.listaDeDispositivos();
            },
            error => {
                this.uiService.alerta( 'Favor habilitar Bluetooth' );
            }
        );
    }

    // Emparejamiendo de dispositico
    listaDeDispositivos() {
        this.bluetoothSerial.list().then(

        success => {
            this.dispositivos = success;
            this.listToggle = true;
        },

        error => {
            this.uiService.alerta( 'Favor habilitar Bluetooth' );
            this.listToggle = false;
        });
    }

    seleccionarDispositivo() {

        // console.log('this.dispositivoID', this.dispositivoID);

        const connectedDevice = this.dispositivos[this.dispositivoID];
        // console.log('connectedDevice', connectedDevice);

        if (!connectedDevice.address) {

            this.uiService.alerta( 'Seleccionar dispositivo a conectar' );
            return;
        }

        const address = connectedDevice.address;

        this.connect(address);
    }

    connect( address: any ) {
        // Attempt to connect device with specified address, call app.deviceConnected if success
        this.bluetoothSerial.connect(address).subscribe(

            success => {
                this.deviceConnected();
                this.uiService.presentToast( 'Conexion realizada correctamente.' );
            },

            error => {
                console.log(error);
                this.uiService.alerta( 'Error al conectar con el dispositivo' );
            }
        );
    }

    deviceConnected() {
        // Subscribe to data receiving as soon as the delimiter is read
        this.bluetoothSerial.subscribe('\n').subscribe(

            success => {

                this.uiService.presentToast( success );
                this.uiService.presentToast( 'Conexion realizada correctamente' );
            },

            error => {

                this.uiService.alerta( error );
            }
        );
    }

    async enviarDato() {
        // tslint:disable-next-line: no-unused-expression
        const dataXML = this.XMLEstaticos[this.indexXML];

        let invoiceData: any;

        if ( this.XMLInput === '' ) {

            // const invoiceData = await this.xmlService.invoicedAsset( dataXML.url );
            invoiceData = await this.xmlService.invoiceStructura( '', dataXML.url );
        } else {
            invoiceData = await this.xmlService.invoiceStructura( this.XMLInput , '' );
        }

        await this.bluetoothSerial.write( invoiceData.cuerpo[0] ).then(

            success => {
                this.uiService.presentToast( success );
            },

            error => {
                console.log('error', error);
                this.uiService.alerta( error );
            }
        );

        invoiceData.detalle[0].map( async (invoice: any) => {

            await this.bluetoothSerial.write( invoice ).then(

                success => {
                    this.uiService.presentToast( success );
                },

                error => {
                    console.log('error', error);
                    this.uiService.alerta( error );
                }
            );
        });


        await this.bluetoothSerial.write( invoiceData.barcode[0] ).then(

            success => {
                this.uiService.presentToast( success );
            },

            error => {
                console.log('error', error);
                this.uiService.alerta( error );
            }
        );

        await this.bluetoothSerial.write( invoiceData.footer[0] ).then(

            success => {
                this.uiService.presentToast( success );
            },

            error => {
                console.log('error', error);
                this.uiService.alerta( error );
            }
        );
    }

    elegirDispositivo( index ) {
        this.dispositivoID = index;
        // console.log('event', index);
    }

    elegirXML( index: number ) {

        this.XMLEstaticos.forEach ( xml => {
            xml.select = false;
        });

        this.XMLEstaticos[ index ].select = true;
        this.indexXML = index;

        this.XMLInput = '';
    }

    fileChangeEvent( fileInput: any) {

        // console.log(fileInput);
        // console.log( fileInput.path[26].FileEntry );
        // this.filesToUpload = <Array<File>>fileInput.target.files;
        // console.log(this.filesToUpload);

        const file = fileInput.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
            const xmlData: string = (evt as any).target.result;
            // console.log('xmlData', xmlData);
            this.XMLInput = xmlData;
            // this.xmlService.test( xmlData );

            this.XMLEstaticos.forEach ( xml => {
                xml.select = false;
            });
        };
        reader.readAsText(file);
        // console.log('readAsText', reader.readAsText(file));

    }

}
