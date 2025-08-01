const path = require('node:path');

const { UF, VersaoManual, Ambiente } = require("../build/container/types/IConfig");

const demoConfig = {
  uf: UF.PR,
  versaoManual: VersaoManual.vm60,
  ambiente: Ambiente.HOMOLOGACAO,
  cnpj: '99999999999999',
  idTokenCSC: '12345678',
  tokenCSC: '12345678910',
  caminhoCertificado: '/home/usuario/use_o_caminho_completo_do_certificado.pfx',
  senhaCertificado: 'senha do certificado',
  nomeImpressora: 'nome da impressora',
  diretorioImpressao: path.resolve('demo/impressao'),
  diretorioXmlDestinatario: path.resolve('demo/xml_destinatario'),
  diretorioLog: path.resolve('demo/log'),
}

const configLicense = {
  cnpjSH: '99999999999999',
  tokenSH: '12345abcde12345abcde12345abcde12345abcde',
}

module.exports = { demoConfig, configLicense };
