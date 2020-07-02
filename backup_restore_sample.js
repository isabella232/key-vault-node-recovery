// --------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for
// license information.
// --------------------------------------------------------------------------
'use strict;'

const KeyVaultSampleBase = require('./key_vault_sample_base');

class BackupRestoreSample extends KeyVaultSampleBase {
    async runSample() {
        var self = this;
        
        // Authenticate to Key Vault and set up our Key Vault Client and Management Client
        await self._authenticate(); 
        
        // Create two key vaults for sample purposes
        self._firstVault = await self._createVault();
        self._secondVault = await self._createVault();

        await self._getVaultClient(self._firstVault.properties.vaultUri, self._secondVault.properties.vaultUri);

        // Run our individual backup and restore samples now that setup is complete
        await self.backupRestoreKey();
        await self.backupRestoreSecret();
        await self.backupRestoreCertificate();
    }

    async backupRestoreKey() {
        var self = this;
        
        console.log('************************************');
        console.log('  Key backup and restore sample.    ');
        console.log('************************************');
        var keyName = self._getName('key');
        var key = await self.keyClientForBackup.createKey(keyName, 'RSA');


        console.log('Created key ' + keyName);
        console.log('Backing up key.');
        var keyBackup = await self.keyClientForBackup.backupKey(keyName);

        console.log('Backed up key ' + keyName);

        console.log('Restoring');
        var restored = await self.keyClientForRestore.restoreKeyBackup(keyBackup)

        console.log('Restored key ' + keyName);
        var keys = await self.keyClientForRestore.listPropertiesOfKeys();

        console.log('Vault ' + self._secondVault.name +  ' keys:');
        for await (const keyProperties of keys) {
            console.log('  kid: ' + keyProperties.kid);
        }
    }

    async backupRestoreSecret() {
        var self = this;

        console.log('************************************');
        console.log('  Secret backup and restore sample. ');
        console.log('************************************');

        var secretName = self._getName('secret');
        var secret = await self.secretClientForBackup.setSecret(secretName, 'AValue');

        console.log('Created secret: ' + secretName);
        console.log(secret);
        
        console.log('Backing up secret');
        var secretBackup = await self.secretClientForBackup.backupSecret(secretName);
        
        console.log('Backed up secret ' + secretName);
        console.log('Restoring.');
        var restored = await self.secretClientForRestore.restoreSecretBackup(secretBackup);

        console.log('Restored secret ' + secretName);
        var secrets = await self.secretClientForRestore.listPropertiesOfSecrets();

        console.log('Vault ' + self._secondVault.name +  ' secrets:');
        for await (const secretProperties of secrets) {
            console.log('  Secret ID: ' + secretProperties.id);
        }
    }

    async backupRestoreCertificate() {
        var self = this;
        var certPolicyOptions = {
            'certificatePolicy': {
                'keyProperties': {
                    'keySize': 4096,
                    'reuseKey': false
                }
            },
            'issuerName': 'Self',
            'subject': 'CN=www.contoso.com',
            'x509CertificateProperties': {
                'validityInMonths': 12
            },
            'certificateAttributes': {
                'enabled': true
            }
        };

        

        console.log('******************************************');
        console.log('  Certificate backup and restore sample.  ');
        console.log('******************************************');


        var certificateName = self._getName('certificate');
        console.log('Creating certificate: ' + certificateName);
        var certificate = await self.certificateClientForBackup.beginCreateCertificate(certificateName, certPolicyOptions);
        await certificate.pollUntilDone();
        console.log('Created certificate ' + certificateName);
        
        var certOp = await self.certificateClientForBackup.getCertificateOperation(certificateName);
        
        // wait for cert to actually be created
        while( certOp.status == 'inProgress' ) {
          certOp = await self.certificateClientForBackup.getCertificateOperation(certificateName);
          await self._sleep(1000);
        }
        
        console.log('Backing up certificate.');
        var certificateBackup = await self.certificateClientForBackup.backupCertificate(certificateName);

        console.log('Backed up certificate ' + certificateName);

        console.log('Restoring.');
        var restored = await self.certificateClientForRestore.restoreCertificateBackup(certificateBackup);
        console.log(restored);
        
        console.log('Restored certificate ' + certificateName);
        var certificates = await self.certificateClientForRestore.listPropertiesOfCertificates();

        console.log('Vault ' + self._secondVault.name +  ' certificates:');
        for await (const certificateProperties of certificates) {
            console.log('  ID: ' + certificateProperties.id);
        }
    }
}

if (require.main === module) {
    var backupRestoreSample = new BackupRestoreSample();
    backupRestoreSample.runSample()
        .catch( (err) => { console.log(err.stack); });
}