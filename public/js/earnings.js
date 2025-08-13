  // Source selection handling for add form
  function handleSourceChange(select) {
    const customInput = document.getElementById('source-custom');
    const hiddenInput = document.getElementById('source');
    
    if (select.value === 'Other') {
      customInput.classList.remove('d-none');
      customInput.focus();
      hiddenInput.value = customInput.value || 'Other';
    } else {
      customInput.classList.add('d-none');
      hiddenInput.value = select.value;
    }
  }

  // Auto-hide any alert message after 3 seconds
  document.addEventListener("DOMContentLoaded", function () {
    const alertEl = document.querySelector(".alert-dismissible");
    if (alertEl) {
      setTimeout(() => {
        const bsAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
        bsAlert.close();
      }, 3000);
    }
  });


  // Source selection handling for edit form
  function handleEditSourceChange(select, id) {
    const customInput = document.getElementById(`source-custom-edit-${id}`);
    if (select.value === 'Other') {
      customInput.classList.remove('d-none');
      customInput.focus();
    } else {
      customInput.classList.add('d-none');
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    // Initialize source select for add form
    const customInput = document.getElementById('source-custom');
    const select = document.getElementById('source-select');
    const hiddenInput = document.getElementById('source');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('date').value = `${year}-${month}-${day}`;
    document.getElementById('timezoneOffset').value = now.getTimezoneOffset();
    
    if (select.value === 'Other') {
      customInput.classList.remove('d-none');
    } else {
      customInput.classList.add('d-none');
    }
    
    customInput.addEventListener('input', function() {
      if (select.value === 'Other') {
        hiddenInput.value = this.value || 'Other';
      }
    });

    // Edit income functionality
    document.querySelectorAll('.edit-income').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        toggleEditMode(id, true);
      });
    });

    document.querySelectorAll('.cancel-edit').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        toggleEditMode(id, false);
      });
    });

    document.querySelectorAll('.save-income').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        saveIncomeChanges(id);
      });
    });

    // Delete income functionality
    document.querySelectorAll('.delete-income').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this income record?')) {
          deleteIncome(id);
        }
      });
    });
  });

  function toggleEditMode(id, enable) {
    // Toggle display elements
    document.getElementById(`source-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`source-edit-container-${id}`).classList.toggle('d-none', !enable);
    document.getElementById(`amount-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`amount-edit-${id}`).classList.toggle('d-none', !enable);
    document.getElementById(`frequency-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`frequency-edit-${id}`).classList.toggle('d-none', !enable);
    
    // Toggle action buttons
    document.getElementById(`action-buttons-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`save-buttons-${id}`).classList.toggle('d-none', !enable);
    
    // Highlight row
    document.getElementById(`income-row-${id}`).classList.toggle('table-warning', enable);
    
    // Initialize custom source input visibility
    if (enable) {
      const sourceSelect = document.getElementById(`source-edit-${id}`);
      handleEditSourceChange(sourceSelect, id);
    }
  }

  async function saveIncomeChanges(id) {
    const sourceSelect = document.getElementById(`source-edit-${id}`);
    const customSourceInput = document.getElementById(`source-custom-edit-${id}`);
    const amountInput = document.getElementById(`amount-edit-${id}`).querySelector('input');
    const frequencySelect = document.getElementById(`frequency-edit-${id}`);
    
    let newSource = sourceSelect.value;
    // If "Other" is selected, use the custom input value
    if (newSource === 'Other') {
      newSource = customSourceInput.value.trim() || 'Other';
    }
    
    const newAmount = parseFloat(amountInput.value);
    const newFrequency = frequencySelect.value;

    if (isNaN(newAmount) || newAmount <= 0) {
      showAlert('danger', 'Please enter a valid amount');
      return;
    }

    if (newSource.trim() === '') {
      showAlert('danger', 'Please enter a source');
      return;
    }

    try {
      const response = await fetch(`/earnings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source: newSource,
          amount: newAmount,
          frequency: newFrequency
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update display fields
        document.getElementById(`source-display-${id}`).textContent = newSource;
        document.getElementById(`amount-display-${id}`).textContent = `$${newAmount.toFixed(2)}`;
        
        // Update frequency display
        const frequencyDisplay = document.getElementById(`frequency-display-${id}`);
        frequencyDisplay.textContent = newFrequency.charAt(0).toUpperCase() + newFrequency.slice(1);
        
        // Update badge color
        const badgeClass = 
          newFrequency === 'one-time' ? 'secondary' :
          newFrequency === 'weekly' ? 'info' :
          newFrequency === 'biweekly' ? 'primary' : 'warning';
        frequencyDisplay.className = `badge bg-${badgeClass}`;
        
        toggleEditMode(id, false);
        if (data.alert) {
          showAlert(data.alert.type, data.alert.message);
        }
      } else {
        throw new Error(data.error || 'Failed to update income');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('danger', error.message || 'An error occurred while updating the income');
    }
  }

  async function deleteIncome(id) {
    try {
      const response = await fetch(`/earnings/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show the alert before removing the row
        if (result.alert) {
          showAlert(result.alert.type, result.alert.message);
        }
        
        // Remove the row from the UI
        const row = document.getElementById(`income-row-${id}`);
        if (row) {
          row.classList.add('fade-out');
          
          
          setTimeout(() => {
            row.remove();
            updateTotalDisplay();
          }, 300);
        }
      } else {
        throw new Error(result.error || 'Failed to delete income');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('danger', error.message);
    }
}

function updateTotalDisplay() {
  setTimeout(() =>{
    window.location.reload();
  }, 2000);
}

function showAlert(type, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  const h1 = document.getElementById('top-title-h1');

  if (h1) {
    h1.insertAdjacentElement('afterend', alertDiv);
  } else {
    container.prepend(alertDiv);
  }

  // Auto-hide after 3 seconds
  setTimeout(() => {
    const alertInstance = bootstrap.Alert.getOrCreateInstance(alertDiv);
    alertInstance.close();
  }, 3000);
}
