const Init = {
  cacheSelectors() {
    this.$modalOverlay = document.querySelector('.modal-overlay')
    this.$toggleModal = document.querySelectorAll('.toggleModal')
    this.$dataTable = document.querySelector('#data-table tbody')
    this.$incomeBalance = document.getElementById('incomeBalance')
    this.$expenseBalance = document.getElementById('expenseBalance')
    this.$totalBalance = document.getElementById('totalBalance')
    this.$form = document.querySelector('form')
    this.$inputDescription = document.getElementById('description')
    this.$inputAmount = document.getElementById('amount')
    this.$inputDate = document.getElementById('date')
    this.$darkMode = document.getElementById('darkMode')
    this.$cancel = document.querySelector('.cancel')
    this.$submit = document.querySelector('.submit')
  },

  Events() {
    this.$toggleModal.forEach($tgModal => $tgModal.addEventListener('click', () => General.toggleModal()))

    this.$cancel.addEventListener('click', () => Form.clearFields())

    this.$darkMode.addEventListener('click', () => {
      Mode.set(!this.$darkMode.classList.contains('active'))
      General.toggleDarkMode()
    })
    
    this.elementUpdate = 0

    this.$form.addEventListener('submit', (event) => {
      event.preventDefault()

      try {
        Form.validateFields()
        this.$submit.classList.contains('updating') ? 
        Transaction.addTransaction(Form.formatValues(), this.elementUpdate, 1) : 
        Transaction.addTransaction(Form.formatValues())
        Form.clearFields()   
        General.toggleModal()
      } catch (error) {
        this.$inputDate.nextElementSibling.innerHTML = error.message
      }
    })

  },
}

const General = {
  buttons() {
    this.$removeButtons = document.querySelectorAll('.remove')
    this.$removeButtons.forEach((rmButton, index) => 
    rmButton.addEventListener('click', () => Transaction.removeTransaction(index)))

    this.$updateButtons = document.querySelectorAll('.update')
    this.$updateButtons.forEach((upButton, index) => 
    upButton.addEventListener('click', () => Transaction.updateTransaction(index)))
  },

  toggleModal() {    
    Init.$modalOverlay.classList.toggle('active')
  },

  toggleDarkMode() {
    Init.$darkMode.classList.toggle('active')
    document.querySelector('body').classList.toggle('darkMode')
    document.querySelectorAll('.card').forEach(element => element.classList.toggle('darkMode'))
    document.querySelectorAll('#data-table th').forEach(element => element.classList.toggle('darkMode'))
    document.querySelectorAll('#data-table td').forEach(element => element.classList.toggle('darkMode'))
    document.querySelector('.modal').classList.toggle('darkMode')
    document.querySelectorAll('form input').forEach(element => element.classList.toggle('darkMode'))
    document.querySelector('.help').classList.toggle('darkMode')
  }
  
}

const Storage = {
  get() {
    return JSON.parse(localStorage.getItem('transactions')) || []
  },
  set(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }
}

const Mode = {
  get() {
    return JSON.parse(localStorage.getItem('mode'))
  },
  set(mode) {
    localStorage.setItem('mode', JSON.stringify(mode))
  }
}

const Transaction = {

  transactions: Storage.get(),

  buildTransactions() {
    let html = ''
  
    this.transactions.forEach(transaction => 
      html += this.getTransactions(transaction.description, transaction.amount, transaction.date)
    )
    
    Init.$dataTable.innerHTML += html

  },
  
  getTransactions(description, amount, date) {
    return `
    <tr>
      <td>${description}</td>
      <td class="${amount >= 0 ? 'income' : 'expense'}">${Formatter.currency(amount)}</td>
      <td>${date}</td>
      <td><img class="remove" src="./assets/minus.svg" alt="Deletar Transação"></td>
      <td><img class="update" src="./assets/pencil.svg" alt="Modificar Transação"></td>
    </tr>
    `
  },

  calculateTransaction(desc) {
    let acc = 0
    this.transactions.forEach(transaction => {
      if (desc === 'income' && transaction.amount > 0) {
        acc += transaction.amount
      } else if (desc === 'expense' && transaction.amount < 0) {
        acc += transaction.amount
      } else if (desc === 'total') {
        acc += transaction.amount
      } 
    })
    return acc
  },

  updateBalance() {
    Init.$incomeBalance.innerHTML = Formatter.currency(this.calculateTransaction('income'))
    Init.$expenseBalance.innerHTML = Formatter.currency(this.calculateTransaction('expense')) 
    Init.$totalBalance.innerHTML = Formatter.currency(this.calculateTransaction('total')) 
  },

  addTransaction(newTransaction, index = 0, qtd = 0) {
    this.transactions.splice(index, qtd, newTransaction)
    App.reload()
    Mode.get() ? document.querySelectorAll('#data-table td').forEach(element => element.classList.toggle('darkMode')) : ''
  },

  removeTransaction(index) {
    this.transactions.splice(index, 1)
    App.reload()
    Mode.get() ? document.querySelectorAll('#data-table td').forEach(element => element.classList.toggle('darkMode')) : ''
  },
  
  updateTransaction(index) {
    General.toggleModal()
    const {description, amount, date} = Storage.get()[index]
    Init.$inputDescription.value = description
    Init.$inputAmount.value = (amount/100).toFixed(2)    
    Init.$inputDate.value = `${date.split('/')[2]}-${date.split('/')[1]}-${date.split('/')[0]}`
    Init.$submit.classList.add('updating')
    Init.elementUpdate = index
  }
}

const Formatter = {
  currency(value) {
    const signal = Number(value) < 0 ? '-' : ''

    value = String(value).replace(/\D/g, '') //regex
    value = Number(value)/100 // colocando casas decimais
    value = value.toLocaleString('pt-br', {
      style: 'currency',
      currency: 'BRL'
    })

    return signal + value

  },

  amount(value) {
    value *=  100

    return Math.round(value)
  },
  date(date) {
    const splittedDate = date.split('-')

    return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
  }
}

const Form = {
  getValues() {
    return {
      description: Init.$inputDescription.value,
      amount: Init.$inputAmount.value,
      date: Init.$inputDate.value
    }
  },
  validateFields() {
    const {description, amount, date} = this.getValues()
    
    if(description.trim() === '' || amount.trim() === '' || date.trim() === '') {
      throw new Error('Por favor, preencha todos os campos.')
    }
  },
  formatValues() {
    let {description, amount, date} = this.getValues()
    amount = Formatter.amount(amount)
    date = Formatter.date(date)

    return {description, amount, date}
  },
  clearFields() {
    Init.$submit.classList.remove('updating')
    Init.$inputDescription.value = ''
    Init.$inputAmount.value = ''
    Init.$inputDate.value = ''
    Init.$inputDate.nextElementSibling.innerHTML = ''
  }
}

const App = {
  init() {
    Init.cacheSelectors()
    Init.Events()
    this.main()
    Mode.get() ? General.toggleDarkMode() : ''
  },
  main() {
    Transaction.buildTransactions()
    Transaction.updateBalance()
    General.buttons()
    Storage.set(Transaction.transactions)
  },
  reload() {
    Init.$dataTable.innerHTML = ''
    this.main()
  }
}

App.init()
