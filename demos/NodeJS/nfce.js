const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const {TspdNFCe} = require('componente-nfce-sdk')

const { demoConfig, configLicense } = require('./demoConfig');

function extractValueTagXml(xml, tag) {
  const result = new RegExp(`<(${tag}).*>([^<]*?)</\\1>`, 'im').exec(xml);
  return (result && result[2]) || '';
}

function getLocalDateTime() {
  const date = new Date();
  const offset = -3 * 60; // UTC-3:00 em minutos
  return new Date(date.getTime() + offset * 60 * 1000);
}

function getFormattedDateTime() {
  const localTime = getLocalDateTime();
  return localTime.toISOString().split('.')[0];
}

function log(...values) {
  const vals = values.map(value => {
    if (typeof value === 'string' && value.length > 300) {
      return value.slice(0, 300) + '...';
    }
    return value;
  });
  const timestamp = getLocalDateTime().toISOString()
    .replace('T', ' ')
    .replace('Z', '');
  console.log(`[${timestamp}]`, ...vals);
}

async function main() {
  const nfce = new TspdNFCe();

  log(await nfce.checkStatus());

  nfce.UF = 'SP';
  nfce.VersaoManual = 'vm60';
  nfce.Ambiente = 'HOMOLOGACAO';
  nfce.CNPJ = '29062609000177';
  nfce.CaminhoCertificado = '';
  nfce.SenhaCertificado = '';
  nfce.IdTokenCSC = '';
  nfce.TokenCSC = '';

  nfce.configurarSoftwareHouse(configLicense.cnpjSH,configLicense.tokenSH);

  log('Configurações via fonte:', JSON.stringify(nfce.getConfig()));

  nfce.loadConfig(demoConfig)

  
  nfce.configurarSoftwareHouse(configLicense.cnpjSH, configLicense.tokenSH);

  log('Configurações via loadConfig:', JSON.stringify(nfce.getConfig()));

  const chave = await nfce.calculaChaveNFCe('2023-12-12', '41', '29062609000177', '65', '1', '100', '1', '1');
  log('Chave calculada:', chave);

  const statusServico = await nfce.statusServico();
  log('Status da Sefaz:', statusServico);

  // Atualizar data de emissão, incrementar número da nota
  const dt = getFormattedDateTime();

  const tx2FileName = path.resolve('NFCe Tecnospeed Negócios 400 autorizando.tx2');
  const tx2 = fs.readFileSync(tx2FileName, 'latin1');
  const tx2Arr = tx2.split('\n')
    .map((linha) => {
    if (linha.startsWith('dhEmi_B09')) return `dhEmi_B09=${dt}-03:00`;
    if (linha.startsWith('nNF_B08')) {
      value = linha.split('=')[1].trim();
      valInt = parseInt(value);
      return `nNF_B08=${valInt + 1}`;
    }
    return linha;
  })

  const tx2Content = tx2Arr.join('\n');
  fs.writeFileSync(tx2FileName, tx2Content, 'latin1');

  const xml = await nfce.converterLoteParaXml(tx2Content, 'pl_009g');
  log('XML gerado:', xml);

  const signedXml = await nfce.assinarNota(xml);
  log('XML assinado:', signedXml);

  const retEnvio = await nfce.enviarNota('001', signedXml);
  log('Retorno do envio:', retEnvio);

  const chaveNota = extractValueTagXml(retEnvio, 'chNFe');
  let protocolo;

  if (chaveNota) {
    log('Chave da nota autorizada:', chaveNota);
    protocolo = extractValueTagXml(retEnvio, 'nProt');
  }
  else {
    const motivo = extractValueTagXml(retEnvio, 'xMotivo');
    log('Nota não foi autorizada. Motivo:', motivo);
    process.exit(1);
  }

  const consulta = await nfce.consultar(chaveNota);
  log('Consulta:', consulta);

  const impressao = await nfce.imprimir(chaveNota);
  log('Impressão:', impressao);

  const dtEvento = getFormattedDateTime();
  const cancelamento = await nfce.cancelar(chaveNota, protocolo, 'Teste de cancelamento de nota', dtEvento, '1', '-03:00', '001');
  log('Cancelamento:', cancelamento);

  log('FIM');
}

main().catch((error) => {
  log('Erro: ' + error.message);
});
