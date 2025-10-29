// This is the core logic for API interaction
document.addEventListener('DOMContentLoaded', () => {
    // Get all the necessary elements from your HTML form
    const form = document.querySelector('form');
    const resultTextarea = document.getElementById('result');
    const binInput = document.getElementById('bin');
    const monthInput = document.getElementById('month');
    const yearInput = document.getElementById('year');
    const cvcInput = document.getElementById('cvc');
    const quantityInput = document.getElementById('quantity');
    const generateButton = document.querySelector('.btn-block');

    // Your API endpoint URL
    const API_BASE_URL = 'https://cc-gen-lime.vercel.app/generate';

    // Set default quantity to 15
    if (quantityInput) {
        quantityInput.value = 15;
    }

    // Event listener for the "Generate Cards" button
    if (generateButton) {
        generateButton.addEventListener('click', async (e) => {
            e.preventDefault(); // Stop the form from submitting normally

            // Get and process the user's input
            const bin = binInput.value.replace(/[^0-9]/g, ''); // Remove all non-numeric characters from the BIN
            let quantity = parseInt(quantityInput.value, 10) || 15; // Use default quantity if not specified

            // Get the maximum allowed quantity from the input's max attribute
            const maxQuantity = parseInt(quantityInput.getAttribute('max'), 10);

            // Validate quantity against the maximum allowed
            if (maxQuantity && quantity > maxQuantity) {
                resultTextarea.value = `Error: Quantity cannot exceed ${maxQuantity}.`;
                return; // Stop further execution
            }

            // Get checkbox states
            const monthYearCheckbox = document.querySelector('.input-group-addon input[type="checkbox"]');
            const cvcCheckboxElement = document.querySelector('.cvc-group .input-group-addon input[type="checkbox"]');

            const month = monthYearCheckbox && monthYearCheckbox.checked ? monthInput.value : '';
            const year = monthYearCheckbox && monthYearCheckbox.checked ? yearInput.value : '';
            const cvc = cvcCheckboxElement && cvcCheckboxElement.checked ? cvcInput.value : '';

            // Construct the API URL with query parameters based on user input
            let apiUrl = `${API_BASE_URL}?bin=${bin}&limit=${quantity}`;

            // Conditionally add month, year, and CVV to the URL if they are provided
            if (month) {
                apiUrl += `&month=${month}`;
            }
            if (year) {
                // Your API uses a 2-digit year format (e.g., '28' for 2028)
                const lastTwoDigitsOfYear = year.slice(-2);
                apiUrl += `&year=${lastTwoDigitsOfYear}`;
            }
            if (cvc) {
                apiUrl += `&cvv=${cvc}`;
            }

            // Display a loading message
            resultTextarea.value = 'Generating cards... Please wait...';

            try {
                // Make the GET request to your API
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const data = await response.json();

                // Check if the API returned cards and display them
                if (data && data.cards && data.cards.length > 0) {
                    const generatedCards = data.cards
                        .map(card => `${card.number}|${card.expiry}|${card.cvv}`)
                        .join('\n');
                    resultTextarea.value = generatedCards;
                } else {
                    resultTextarea.value = 'No cards were generated. Please check the BIN or API status.';
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                resultTextarea.value = `Error: Could not connect to the API. Details: ${error.message}`;
            }
        });
    }

    // Initially disable month, year, and CVC inputs if checkboxes are not checked
    const monthYearCheckbox = document.querySelector('.input-group-addon input[type="checkbox"]');
    const cvcCheckboxElement = document.querySelector('.cvc-group .input-group-addon input[type="checkbox"]');

    // Function to populate years
    function populateYears() {
        const currentYear = new Date().getFullYear();
        const endYear = currentYear + 15;
        yearInput.innerHTML = '<option value="">Random</option>'; // Clear existing options

        for (let year = currentYear; year <= endYear; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearInput.appendChild(option);
        }
    }

    // Function to populate months and handle current month
    function populateMonths() {
        const currentMonth = new Date().getMonth() + 1; // getMonth() is 0-indexed
        const currentYear = new Date().getFullYear();
        const selectedYear = parseInt(yearInput.value, 10);

        monthInput.innerHTML = '<option value="">Random</option>'; // Clear existing options

        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const option = document.createElement('option');
            option.value = monthStr;
            option.textContent = monthStr;

            if (monthYearCheckbox.checked && selectedYear === currentYear && month < currentMonth) {
                option.disabled = true; // Disable past months for the current year
            }
            monthInput.appendChild(option);
        }
    }

    // Initial population
    populateYears();
    populateMonths();

    // Set initial states based on checkboxes
    if (monthInput && yearInput) {
        monthInput.disabled = !monthYearCheckbox.checked;
        yearInput.disabled = !monthYearCheckbox.checked;
    }
    if (cvcInput) {
        cvcInput.disabled = !cvcCheckboxElement.checked;
    }

    // Event listener for Month/Year checkbox
    if (monthYearCheckbox) {
        monthYearCheckbox.addEventListener('change', () => {
            monthInput.disabled = !monthYearCheckbox.checked;
            yearInput.disabled = !monthYearCheckbox.checked;
            if (!monthYearCheckbox.checked) {
                monthInput.value = '';
                yearInput.value = '';
            } else {
                // If checked, re-populate to ensure valid dates
                populateYears();
                populateMonths();
                // Set default to a valid month/year if current is invalid
                const currentMonth = new Date().getMonth() + 1;
                const currentYear = new Date().getFullYear();
                if (parseInt(yearInput.value, 10) === currentYear && parseInt(monthInput.value, 10) < currentMonth) {
                    monthInput.value = currentMonth.toString().padStart(2, '0');
                }
            }
        });
    }

    // Event listener for CVC checkbox
    if (cvcCheckboxElement) {
        cvcCheckboxElement.addEventListener('change', () => {
            cvcInput.disabled = !cvcCheckboxElement.checked;
            if (!cvcCheckboxElement.checked) {
                cvcInput.value = '';
            }
        });
    }

    // Ensure current month/year is not selectable if checkbox is checked
    monthInput.addEventListener('change', () => {
        const selectedMonth = parseInt(monthInput.value, 10);
        const selectedYear = parseInt(yearInput.value, 10);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        if (monthYearCheckbox.checked) {
            if (selectedYear === currentYear && selectedMonth < currentMonth) {
                // If a past month is selected for the current year, reset to current month
                monthInput.value = currentMonth.toString().padStart(2, '0');
            }
        }
    });

    yearInput.addEventListener('change', () => {
        const selectedMonth = parseInt(monthInput.value, 10);
        const selectedYear = parseInt(yearInput.value, 10);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        // Re-populate months based on the newly selected year to disable past months if applicable
        populateMonths();

        if (monthYearCheckbox.checked) {
            if (selectedYear === currentYear && selectedMonth < currentMonth) {
                // If the selected year is current year and selected month is past, adjust month
                monthInput.value = currentMonth.toString().padStart(2, '0');
            }
        }
    });

});

//drop down and up bin section
function toggleDropdown(header) {
    // Safely get parent elements and required DOM nodes
    const card = header.closest('.bin-dropdown-card');
    if (!card) return; // Exit if card not found
    
    const details = card.querySelector('.bin-dropdown-details');
    const arrow = card.querySelector('.bin-dropdown-arrow');
    
    if (details && arrow) {
        // Toggle classes
        details.classList.toggle('show');
        arrow.classList.toggle('down');
        
        // Optional: Close other open dropdowns
        const allCards = document.querySelectorAll('.bin-dropdown-card');
        allCards.forEach(otherCard => {
            if (otherCard !== card) {
                otherCard.querySelector('.bin-dropdown-details')?.classList.remove('show');
                otherCard.querySelector('.bin-dropdown-arrow')?.classList.remove('down');
            }
        });
    }
}

// টোস্ট নোটিফিকেশন ফাংশন
function showCopyNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = 'toast-notification';
    if (isError) {
        notification.classList.add('error');
    }
    notification.textContent = message;
    document.body.appendChild(notification);
    
    void notification.offsetWidth;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 200);
    }, 1500);
}

// "Copy Cards" বাটনের জন্য উন্নত কপি ফাংশন
function copy() {
    const textarea = document.querySelector('textarea');
    if (!textarea || !textarea.value.trim()) {
        showCopyNotification("Nothing to copy, please generate first.", true);
        return;
    }
    
    const textToCopy = textarea.value;

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showCopyNotification("Copy Done! ✓");
                textarea.select();
                textarea.setSelectionRange(0, textarea.value.length);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showCopyNotification("Failed to copy! Please try again.", true);
            });
    } else {
        try {
            textarea.select();
            document.execCommand('copy');
            showCopyNotification("Copy Done! ✓");
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
        } catch (err) {
            console.error('Failed to copy: ', err);
            showCopyNotification("Failed to copy! Please try again.", true);
        }
    }
}

// বিন ডিটেইলসের প্রতিটি কপিযোগ্য উপাদানে ইভেন্ট লিসেনার যুক্ত করা
document.querySelectorAll('.bin-dropdown-value').forEach(element => {
    element.addEventListener('click', function() {
        const textToCopy = this.textContent;
        // আধুনিক ব্রাউজারের জন্য navigator.clipboard API ব্যবহার করা হয়েছে
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    showCopyNotification("Copy Done! ✓");
                })
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    showCopyNotification("Failed to copy! Please try again.", true);
                });
        } else {
            // পুরোনো ব্রাউজারের জন্য বা যদি secure context না থাকে তাহলে fallback
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = textToCopy;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            showCopyNotification("Copy Done! ✓");
        }
    });
});

// মেনু টগল ফাংশন
      function toggleMenu() {
  const menu = document.getElementById('dropdown-menu');
  menu.classList.toggle('show');
}

document.addEventListener('click', function (event) {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('dropdown-menu');

  if (!menu.contains(event.target) && !toggle.contains(event.target)) {
    menu.classList.remove('show');
  }
});
