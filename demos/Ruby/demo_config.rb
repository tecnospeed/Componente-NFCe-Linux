require 'pathname'
require 'tspd-nfce/types'

DEMO_CONFIG = ConfigDto.new(
  uf: 'PR',
  versao_manual: 'vm60',
  ambiente: 'HOMOLOGACAO',
  cnpj: '11111111111111',
  id_token_csc: '000001',
  token_csc: 'ASDFGHASDFGHASDFGHASDFGHASDFGHASDFGH',
  caminho_certificado: '/home/usuario/use_o_caminho_completo_do_certificado.pfx',
  senha_certificado: 'senha do certificado',
  nome_impressora: 'nome da impressora',
  diretorio_impressao: Pathname.new(Dir.pwd).join('impressao'),
  diretorio_xml_destinatario: Pathname.new(Dir.pwd).join('xml_destinatario'),
  diretorio_log: Pathname.new(Dir.pwd).join('log')
)

CONFIGS_LICENSE = ['99999999999999','12345abcde12345abcde12345abcde12345abcde']
