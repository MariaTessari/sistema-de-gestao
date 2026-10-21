import { useEffect, useState } from 'react'
import './App.css'
import {
  listarFuncionarios,
  criarFuncionario,
  atualizarFuncionario,
  deletarFuncionario,
} from './api'

const FORMULARIO_VAZIO = { nome: '', email: '', cpf: '', senha: '' }

function App() {
  const [funcionarios, setFuncionarios] = useState([])
  const [formulario, setFormulario] = useState({ ...FORMULARIO_VAZIO })
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let ativo = true

    async function buscar() {
      try {
        const lista = await listarFuncionarios()
        if (!ativo) return
        setFuncionarios(lista)
      } catch (erroApi) {
        if (!ativo) return
        setErro(erroApi.message)
      }
    }

    buscar()

    return () => {
      ativo = false
    }
  }, [])

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  function editar(funcionario) {
    setEditandoId(funcionario.id)
    setFormulario({
      nome: funcionario.nome,
      email: funcionario.email,
      cpf: funcionario.cpf,
      senha: '',
    })
    setErro('')
    setMensagem('')
    document.getElementById('formulario')?.scrollIntoView({ block: 'start' })
  }

  function cancelar() {
    setEditandoId(null)
    setFormulario({ ...FORMULARIO_VAZIO })
    setErro('')
    setMensagem('')
  }

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErro('')
    setMensagem('')

    try {
      const dados = {
        nome: formulario.nome,
        email: formulario.email,
        cpf: formulario.cpf,
      }

      let idSalvo

      if (editandoId) {
        if (formulario.senha) {
          dados.senha = formulario.senha
        }
        const salvo = await atualizarFuncionario(editandoId, dados)
        idSalvo = salvo.id
        setMensagem('Funcionário atualizado.')
      } else {
        if (!formulario.senha) {
          setErro('Informe a senha do funcionário')
          setSalvando(false)
          return
        }
        const criado = await criarFuncionario({ ...dados, senha: formulario.senha })
        idSalvo = criado.id
        setMensagem('Funcionário cadastrado.')
      }

      const lista = await listarFuncionarios()
      setFuncionarios(lista)

      setFormulario({ ...FORMULARIO_VAZIO })
      setEditandoId(null)

      document.getElementById('funcionario-' + idSalvo)?.scrollIntoView({ block: 'center' })
    } catch (erroApi) {
      setErro(erroApi.message)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(funcionario) {
    const confirmado = window.confirm('Excluir ' + funcionario.nome + '?')
    if (!confirmado) return

    try {
      await deletarFuncionario(funcionario.id)
      const lista = await listarFuncionarios()
      setFuncionarios(lista)
    } catch (erroApi) {
      setErro(erroApi.message)
    }
  }

  return (
    <div>
      <h1>Funcionários</h1>

      {erro ? <p>{erro}</p> : null}
      {mensagem ? <p>{mensagem}</p> : null}

      <form id="formulario" onSubmit={salvar}>
        <h2>{editandoId ? 'Editar funcionário' : 'Novo funcionário'}</h2>

        <div className="grade">
          <label>
            Nome
            <input
              required
              value={formulario.nome}
              onChange={(e) => alterarCampo('nome', e.target.value)}
              placeholder="Nome completo"
            />
          </label>

          <label>
            Email
            <input
              required
              type="email"
              value={formulario.email}
              onChange={(e) => alterarCampo('email', e.target.value)}
              placeholder="email@exemplo.com"
            />
          </label>

          <label>
            CPF
            <input
              required
              value={formulario.cpf}
              onChange={(e) => alterarCampo('cpf', e.target.value)}
              placeholder="000.000.000-00"
            />
          </label>

          <label>
            Senha
            <input
              required={!editandoId}
              type="password"
              value={formulario.senha}
              onChange={(e) => alterarCampo('senha', e.target.value)}
              placeholder={editandoId ? 'Deixe vazio para não alterar' : 'Senha de acesso'}
            />
          </label>
        </div>

        <button type="submit" disabled={salvando}>
          Salvar
        </button>{' '}
        <button type="button" onClick={cancelar}>
          {editandoId ? 'Cancelar' : 'Limpar'}
        </button>
      </form>

      <div id="lista">
        <h2>Lista de funcionários</h2>

        {funcionarios.length === 0 ? (
          <p>Nenhum funcionário cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map((funcionario) => (
                <tr key={funcionario.id} id={'funcionario-' + funcionario.id}>
                  <td>{funcionario.id}</td>
                  <td>{funcionario.nome}</td>
                  <td>{funcionario.email}</td>
                  <td>{funcionario.cpf}</td>
                  <td>
                    <button onClick={() => editar(funcionario)}>Editar</button>{' '}
                    <button onClick={() => excluir(funcionario)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App