import { useEffect, useState } from 'react'
import './App.css'
import {
  listarFuncionarios,
  criarFuncionario,
  atualizarFuncionario,
  deletarFuncionario,
  listarTarefas,
  criarTarefa,
  atualizarTarefa,
  deletarTarefa,
} from './api'

const FORMULARIO_VAZIO = { nome: '', email: '', cpf: '', senha: '' }
const FORMULARIO_TAREFA_VAZIO = { titulo: '', dataEntrega: '', funcionarioId: '' }

function App() {
  const [funcionarios, setFuncionarios] = useState([])
  const [formulario, setFormulario] = useState({ ...FORMULARIO_VAZIO })
  const [editandoId, setEditandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [tarefas, setTarefas] = useState([])
  const [formTarefa, setFormTarefa] = useState({ ...FORMULARIO_TAREFA_VAZIO })
  const [editandoTarefaId, setEditandoTarefaId] = useState(null)
  const [erroTarefa, setErroTarefa] = useState('')
  const [mensagemTarefa, setMensagemTarefa] = useState('')
  const [salvandoTarefa, setSalvandoTarefa] = useState(false)

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

    async function buscarTarefas() {
      try {
        const lista = await listarTarefas()
        if (!ativo) return
        setTarefas(lista)
      } catch (erroApi) {
        if (!ativo) return
        setErroTarefa(erroApi.message)
      }
    }

    buscar()
    buscarTarefas()

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

  function alterarCampoTarefa(campo, valor) {
    setFormTarefa((atual) => ({ ...atual, [campo]: valor }))
  }

  function editarTarefa(tarefa) {
    setEditandoTarefaId(tarefa.id)
    setFormTarefa({
      titulo: tarefa.titulo,
      dataEntrega: tarefa.dataEntrega ? String(tarefa.dataEntrega).slice(0, 10) : '',
      funcionarioId: tarefa.funcionarioId,
    })
    setErroTarefa('')
    setMensagemTarefa('')
    document.getElementById('formulario-tarefa')?.scrollIntoView({ block: 'start' })
  }

  function cancelarTarefa() {
    setEditandoTarefaId(null)
    setFormTarefa({ ...FORMULARIO_TAREFA_VAZIO })
    setErroTarefa('')
    setMensagemTarefa('')
  }

  async function salvarTarefa(evento) {
    evento.preventDefault()
    setSalvandoTarefa(true)
    setErroTarefa('')
    setMensagemTarefa('')

    try {
      const dados = {
        titulo: formTarefa.titulo,
        dataEntrega: formTarefa.dataEntrega,
        funcionarioId: Number(formTarefa.funcionarioId),
      }

      let idSalvo

      if (editandoTarefaId) {
        const salvo = await atualizarTarefa(editandoTarefaId, dados)
        idSalvo = salvo.id
        setMensagemTarefa('Tarefa atualizada.')
      } else {
        const criado = await criarTarefa(dados)
        idSalvo = criado.id
        setMensagemTarefa('Tarefa cadastrada.')
      }

      const lista = await listarTarefas()
      setTarefas(lista)

      setFormTarefa({ ...FORMULARIO_TAREFA_VAZIO })
      setEditandoTarefaId(null)

      document.getElementById('tarefa-' + idSalvo)?.scrollIntoView({ block: 'center' })
    } catch (erroApi) {
      setErroTarefa(erroApi.message)
    } finally {
      setSalvandoTarefa(false)
    }
  }

  async function excluirTarefa(tarefa) {
    const confirmado = window.confirm('Excluir ' + tarefa.titulo + '?')
    if (!confirmado) return

    try {
      await deletarTarefa(tarefa.id)
      const lista = await listarTarefas()
      setTarefas(lista)
    } catch (erroApi) {
      setErroTarefa(erroApi.message)
    }
  }

  function nomeFuncionario(id) {
    const f = funcionarios.find((item) => item.id === id)
    return f ? f.nome : id
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

      <h1>Tarefas</h1>

      {erroTarefa ? <p>{erroTarefa}</p> : null}
      {mensagemTarefa ? <p>{mensagemTarefa}</p> : null}

      <form id="formulario-tarefa" onSubmit={salvarTarefa}>
        <h2>{editandoTarefaId ? 'Editar tarefa' : 'Nova tarefa'}</h2>

        <div className="grade">
          <label>
            Título
            <input
              required
              value={formTarefa.titulo}
              onChange={(e) => alterarCampoTarefa('titulo', e.target.value)}
              placeholder="Título da tarefa"
            />
          </label>

          <label>
            Data de entrega
            <input
              required
              type="date"
              value={formTarefa.dataEntrega}
              onChange={(e) => alterarCampoTarefa('dataEntrega', e.target.value)}
            />
          </label>

          <label>
            Funcionário
            <select
              required
              value={formTarefa.funcionarioId}
              onChange={(e) => alterarCampoTarefa('funcionarioId', e.target.value)}
            >
              <option value="">Selecione...</option>
              {funcionarios.map((funcionario) => (
                <option key={funcionario.id} value={funcionario.id}>
                  {funcionario.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" disabled={salvandoTarefa}>
          Salvar
        </button>{' '}
        <button type="button" onClick={cancelarTarefa}>
          {editandoTarefaId ? 'Cancelar' : 'Limpar'}
        </button>
      </form>

      <div id="lista-tarefas">
        <h2>Lista de tarefas</h2>

        {tarefas.length === 0 ? (
          <p>Nenhuma tarefa cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Data de entrega</th>
                <th>Funcionário</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tarefas.map((tarefa) => (
                <tr key={tarefa.id} id={'tarefa-' + tarefa.id}>
                  <td>{tarefa.id}</td>
                  <td>{tarefa.titulo}</td>
                  <td>{tarefa.dataEntrega ? new Date(tarefa.dataEntrega).toLocaleDateString('pt-BR') : ''}</td>
                  <td>{tarefa.funcionario ? tarefa.funcionario.nome : nomeFuncionario(tarefa.funcionarioId)}</td>
                  <td>
                    <button onClick={() => editarTarefa(tarefa)}>Editar</button>{' '}
                    <button onClick={() => excluirTarefa(tarefa)}>Excluir</button>
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
