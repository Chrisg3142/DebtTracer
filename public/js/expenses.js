  // Enable/disable frequency based on recurring toggle
  document.getElementById('isRecurring').addEventListener('change', function() {
    const frequencySelect = document.getElementById('frequency');
    frequencySelect.disabled = !this.checked;
    if (!this.checked) {
      frequencySelect.value = 'one-time';
    }
  });

  // Initialize form state on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Set current date and timezone offset
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('date').value = `${year}-${month}-${day}`;
    document.getElementById('timezoneOffset').value = now.getTimezoneOffset();
    
    // Initialize recurring toggle
    const recurringCheckbox = document.getElementById('isRecurring');
    const frequencySelect = document.getElementById('frequency');
    frequencySelect.disabled = !recurringCheckbox.checked;

    // Edit expense functionality
    document.querySelectorAll('.edit-expense').forEach(button => {
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

    document.querySelectorAll('.save-expense').forEach(button => {
      button.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        saveExpenseChanges(id);
      });
    });

    // Delete expense functionality
    document.querySelectorAll('.delete-expense').forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        const id = this.getAttribute('data-id');
        if (confirm('Are you sure you want to delete this expense record?')) {
          deleteExpense(id);
        }
      });
    });
 
    const autoAlert = document.querySelector(".alert-dismissible");
    if (autoAlert) {
      setTimeout(() => {
        const alertInstance = bootstrap.Alert.getOrCreateInstance(autoAlert);
        alertInstance.close();
      }, 3000); // or 5000 ms if you want it to stay longer
    }
  });

  function toggleEditMode(id, enable) {
    // Toggle display elements
    document.getElementById(`category-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`category-edit-${id}`).classList.toggle('d-none', !enable);
    document.getElementById(`name-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`name-edit-${id}`).classList.toggle('d-none', !enable);
    document.getElementById(`amount-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`amount-edit-${id}`).classList.toggle('d-none', !enable);
    document.getElementById(`frequency-display-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`frequency-edit-container-${id}`).classList.toggle('d-none', !enable);
    
    // Toggle action buttons
    document.getElementById(`action-buttons-${id}`).classList.toggle('d-none', enable);
    document.getElementById(`save-buttons-${id}`).classList.toggle('d-none', !enable);
    
    // Highlight row
    document.getElementById(`expense-row-${id}`).classList.toggle('table-warning', enable);
    
    // Initialize recurring toggle in edit mode
    if (enable) {
      const recurringCheckbox = document.getElementById(`isRecurring-edit-${id}`);
      const frequencySelect = document.getElementById(`frequency-edit-${id}`);
      
      recurringCheckbox.addEventListener('change', function() {
        frequencySelect.disabled = !this.checked;
        if (!this.checked) {
          frequencySelect.value = 'one-time';
        }
      });
    }
  }

  async function saveExpenseChanges(id) {
    const categorySelect = document.getElementById(`category-edit-${id}`);
    const nameInput = document.getElementById(`name-edit-${id}`);
    const amountInput = document.getElementById(`amount-edit-${id}`).querySelector('input');
    const recurringCheckbox = document.getElementById(`isRecurring-edit-${id}`);
    const frequencySelect = document.getElementById(`frequency-edit-${id}`);
    
    const newCategory = categorySelect.value;
    const newName = nameInput.value.trim();
    const newAmount = parseFloat(amountInput.value);
    const newIsRecurring = recurringCheckbox.checked;
    const newFrequency = newIsRecurring ? frequencySelect.value : 'one-time';

    if (isNaN(newAmount) || newAmount <= 0) {
      showAlert('danger', 'Please enter a valid amount');
      return;
    }

    if (newName === '') {
      showAlert('danger', 'Please enter a name');
      return;
    }

    try {
      const response = await fetch(`/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: newCategory,
          name: newName,
          amount: newAmount,
          isRecurring: newIsRecurring ? 'on' : 'off',
          frequency: newFrequency
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update display fields
        document.getElementById(`category-display-${id}`).textContent = newCategory;
        document.getElementById(`category-display-${id}`).className = `badge bg-${
          newCategory === 'Housing' ? 'primary' : 
          newCategory === 'Food' ? 'success' :
          newCategory === 'Transportation' ? 'info' :
          newCategory === 'Utilities' ? 'warning' : 'secondary'
        }`;
        
        document.getElementById(`name-display-${id}`).textContent = newName;
        document.getElementById(`amount-display-${id}`).textContent = `$${newAmount.toFixed(2)}`;
        
        // Update frequency display
        const frequencyDisplay = document.getElementById(`frequency-display-${id}`);
        if (newIsRecurring) {
          frequencyDisplay.innerHTML = `<i class="fas fa-repeat me-1"></i>${newFrequency.charAt(0).toUpperCase() + newFrequency.slice(1)}`;
          frequencyDisplay.className = `badge bg-${
            newFrequency === 'weekly' ? 'info' :
            newFrequency === 'monthly' ? 'warning' : 'secondary'
          }`;
        } else {
          frequencyDisplay.innerHTML = '<i class="fas fa-times me-1"></i> One-time';
          frequencyDisplay.className = 'badge bg-secondary';
        }
        
        toggleEditMode(id, false);
        if (data.alert) {
          showAlert(data.alert.type, data.alert.message);
        }
      } else {
        throw new Error(data.error || 'Failed to update expense');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('danger', error.message || 'An error occurred while updating the expense');
    }
  }

  async function deleteExpense(id) {
    try {
      const response = await fetch(`/expenses/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Show the alert before removing the row
        if (result.alert) {
          showAlert(result.alert.type, result.alert.message);
        }
        
        // Remove the row from the UI
        const row = document.getElementById(`expense-row-${id}`);
        if (row) {
          row.classList.add('fade-out');
          
          setTimeout(() => {
            row.remove();
            updateTotalDisplay();
          }, 300);
        }
      } else {
        throw new Error(result.error || 'Failed to delete expense');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('danger', error.message);
    }
  }

  function updateTotalDisplay() {
    setTimeout(() => {
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
