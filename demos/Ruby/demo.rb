require 'date'
require 'irb/locale'
require 'rexml/document'
require 'tspd-nfce'
require_relative './demo_config_dev'

include REXML

tx2_path = './NFCe Tecnospeed Negócios 400 autorizando.tx2'

# Função para obter a tag de um XML
# @param xml [String] O XML em formato de string
# @param nome_tag [String] O nome da tag a ser buscada
# @return [String, nil] O valor da tag ou nil se não encontrado
#
def obter_tag(xml, nome_tag)
  # Regex para capturar o conteúdo da tag especificada
  matches = /(?<=<#{nome_tag}>).*?(?=<\/#{nome_tag}>)/.match(xml)
  matches ? matches[0] : nil
end

# Função para logar mensagens com timestamp
# @param values [Array<Object>] Os valores a serem logados

def log(*values)
  vals = values.map { |a| a.length > 300 ? a[0...300] + '...' : a }
  puts "[#{DateTime.now}]", *vals
end

nfce = TspdNFCe.new
nfce.load_config(DEMO_CONFIG)
nfce.configurar_software_house(*CONFIGS_LICENSE)


File.open(tx2_path, 'r+') do |f|
  tx2_arr = f.readlines

  # Atualizar data de emissão, incrementar número da nota
  dt = DateTime.now.strftime('%Y-%m-%dT%H:%M:%S')

  tx2_arr.each_with_index do |linha, i|
    if linha.start_with?('dhEmi_B09')
      tx2_arr[i] = "dhEmi_B09=#{dt}-03:00\n"
    end
    if linha.start_with?('nNF_B08')
      value = linha.split('=')[1].strip
      val_int = value.to_i
      tx2_arr[i] = "nNF_B08=#{val_int + 1}\n"
    end
  end

  f.rewind
  f.write(tx2_arr.join)
  f.truncate(f.pos)
end

status = nfce.status_servico
log('Status da Sefaz:', status)

log('Gerando XML...')

tx2 = File.read(tx2_path);
xml = nfce.converter_lote_para_xml(tx2, 'pl_009g')
log('XML gerado:', xml)

xml_assinado = nfce.assinar_nota(xml)
log('XML assinado:', xml_assinado)

ret_envio = nfce.enviar_nota('001', xml_assinado)
log('Retorno do envio:', ret_envio)

chave_nota = obter_tag(ret_envio, 'chNFe')
if chave_nota
  log('Chave da nota autorizada: ', chave_nota)
  protocolo = obter_tag(ret_envio, 'nProt')
else
  motivo = obter_tag(ret_envio, 'xMotivo')
  log('Nota não foi autorizada. Motivo: ', motivo)
  exit(1)
end

consulta = nfce.consultar(chave_nota)
log('Consulta:', consulta)

res_impressao = nfce.imprimir_nota(chave_nota, '')
log('Impressão:', res_impressao)

dtevento = DateTime.now.strftime('%Y-%m-%dT%H:%M:%S')
cancelamento = nfce.cancelar(chave_nota, protocolo, 'Teste de cancelamento de nota', dtevento, '1', '-03:00', '001')
log('Cancelamento:', cancelamento)

log('FIM')
