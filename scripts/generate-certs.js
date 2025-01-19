const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

function generateCertificate() {
    const attrs = [
        { name: 'commonName', value: 'localhost' },
        { name: 'countryName', value: 'US' },
        { name: 'stateOrProvinceName', value: 'California' },
        { name: 'localityName', value: 'San Francisco' },
        { name: 'organizationName', value: 'Local Development' },
        { name: 'organizationalUnitName', value: 'Development' }
    ];

    const pems = selfsigned.generate(attrs, {
        algorithm: 'sha256',
        days: 365,
        keySize: 2048,
        extensions: [{
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' },
                { type: 7, ip: '127.0.0.1' }
            ]
        }]
    });

    // Write private key
    fs.writeFileSync(path.join(process.cwd(), 'key.pem'), pems.private);
    console.log('Generated private key: key.pem');

    // Write certificate
    fs.writeFileSync(path.join(process.cwd(), 'cert.pem'), pems.cert);
    console.log('Generated certificate: cert.pem');
}

generateCertificate();
