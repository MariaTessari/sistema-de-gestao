const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(API_URL + caminho, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  })

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    throw new Error(dados?.erro || 'Não foi possível falar com o servidor')
  }

  return dados
}

export function listarFuncionarios() {
  return requisicao('/funcionario')
}

export function criarFuncionario(funcionario) {
  return requisicao('/funcionario', {
    method: 'POST',
    body: JSON.stringify(funcionario),
  })
}

export function atualizarFuncionario(id, funcionario) {
  return requisicao('/funcionario/' + id, {
    method: 'PUT',
    body: JSON.stringify(funcionario),
  })
}

export function deletarFuncionario(id) {
  return requisicao('/funcionario/' + id, { method: 'DELETE' })
}
