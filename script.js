document.addEventListener('DOMContentLoaded', function () {
    const stockForm = document.getElementById('stockForm');
    const resultTableContainer = document.getElementById('resultTableContainer');
    const tableBody = document.getElementById('tableBody');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const captureArea = document.getElementById('captureArea');
    const currentDateSpan = document.getElementById('currentDate');

    // Set current date in DD/MM/YYYY format
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    currentDateSpan.textContent = `${dd}/${mm}/${yyyy}`;

    // Add Enter key navigation
    const inputs = stockForm.querySelectorAll('input[type="number"]');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Calculate the index of the input in the next row (same column)
                const currentRow = Math.floor(index / 2); // 2 inputs per row
                const column = index % 2; // 0 for Store, 1 for Site
                const nextRowIndex = (currentRow + 1) * 2 + column;
                if (nextRowIndex < inputs.length) {
                    inputs[nextRowIndex].focus();
                } else {
                    // If at the last input, focus the submit button
                    stockForm.querySelector('button[type="submit"]').focus();
                }
            }
        });
    });

    stockForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const items = [
            { name: 'Top Plate', storeId: 'topPlateStore', siteId: 'topPlateSite', life: 1, unit: 'pcs', consumption: 1 },
            { name: 'Bottom Plate 40mm', storeId: 'bottomPlate40mmStore', siteId: 'bottomPlate40mmSite', life: 1, unit: 'pcs', consumption: 1 },
            { name: 'Bottom Plate 65mm', storeId: 'bottomPlate65mmStore', siteId: 'bottomPlate65mmSite', life: 1, unit: 'pcs', consumption: 0.1 },
            { name: 'Upper Nozzle', storeId: 'upperNozzleStore', siteId: 'upperNozzleSite', heatsPerPiece: 10, unit: 'pcs' },
            { name: 'Lower Nozzle', storeId: 'lowerNozzleStore', siteId: 'lowerNozzleSite', heatsPerPiece: 4, unit: 'pcs' },
            { name: 'Top Well Block', storeId: 'topWellBlockStore', siteId: 'topWellBlockSite', heatsPerPiece: 10, unit: 'pcs' },
            { name: 'Bottom Well Block', storeId: 'bottomWellBlockStore', siteId: 'bottomWellBlockSite', heatsPerPiece: 10, unit: 'pcs' },
            { name: '90K Mortar', storeId: 'mortar90kStore', siteId: 'mortar90kSite', life: 1, unit: 'kg', consumption: 2 },
            { name: 'Mastic', storeId: 'masticStore', siteId: 'masticSite', life: 1, unit: 'kg', consumption: 0.5 }
        ];

        const heatsPerDay = 10;
        let stockData = [];

        items.forEach(item => {
            const stockStoreInput = document.getElementById(item.storeId);
            const stockSiteInput = document.getElementById(item.siteId);

            if (!stockStoreInput || !stockSiteInput) {
                console.error(`Input field not found for item: ${item.name}`);
                return;
            }

            // Treat empty inputs as 0
            const stockStore = stockStoreInput.value.trim() === '' ? 0 : parseFloat(stockStoreInput.value);
            const stockSite = stockSiteInput.value.trim() === '' ? 0 : parseFloat(stockSiteInput.value);

            // Validate for negative numbers
            if (stockStore < 0 || stockSite < 0) {
                alert(`Please enter non-negative stock values for ${item.name}.`);
                return;
            }

            const totalStock = stockStore + stockSite;
            let totalHeats;

            // Apply specific heat calculations for certain items
            if (item.name === 'Lower Nozzle') {
                totalHeats = totalStock * 4; // 4 heats per piece
            } else if (item.name === 'Upper Nozzle' || item.name === 'Top Well Block' || item.name === 'Bottom Well Block') {
                totalHeats = totalStock * 10; // 10 heats per piece
            } else {
                // Original logic for other items
                totalHeats = item.unit === 'pcs' ? (totalStock / item.consumption) * item.life : totalStock / item.consumption;
            }

            const daysRemaining = totalHeats / heatsPerDay;

            stockData.push({
                name: item.name,
                stockStore: stockStore,
                stockSite: stockSite,
                totalStock: Math.round(totalStock), // Round to nearest whole number
                totalHeats: Math.round(totalHeats),
                unit: item.unit,
                daysRemaining: Math.round(daysRemaining)
            });
        });

        // If no items were processed due to errors, hide results
        if (stockData.length === 0) {
            resultTableContainer.classList.add('hidden');
            downloadReportBtn.classList.add('hidden');
            return;
        }

        stockData.sort((a, b) => a.daysRemaining - b.daysRemaining);

        tableBody.innerHTML = '';

        stockData.forEach(item => {
            const row = document.createElement('tr');
            row.className = item.daysRemaining < 5 ? 'critical' : item.daysRemaining < 15 ? 'warning' : 'safe';
            row.innerHTML = `
                <td class="p-4">${item.name}</td>
                <td class="p-4">${item.stockStore} ${item.unit}</td>
                <td class="p-4">${item.stockSite} ${item.unit}</td>
                <td class="p-4">${item.totalStock} ${item.unit}</td>
                <td class="p-4">${item.totalHeats}</td>
                <td class="p-4">${item.daysRemaining} days</td>
            `;
            tableBody.appendChild(row);
        });

        resultTableContainer.classList.remove('hidden');
        downloadReportBtn.classList.remove('hidden');
    });

    downloadReportBtn.addEventListener('click', function () {
        if (typeof html2canvas === 'undefined') {
            alert('Error: html2canvas library is not loaded.');
            return;
        }

        // Capture only the captureArea (title and table, excluding button)
        html2canvas(captureArea, {
            backgroundColor: "#ffffff",
            useCORS: true,
            scale: window.devicePixelRatio > 1 ? 2 : 1,
            width: captureArea.offsetWidth,
            height: captureArea.offsetHeight,
            windowWidth: document.body.scrollWidth,
            windowHeight: document.body.scrollHeight
        }).then(canvas => {
            const imageDataURL = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = imageDataURL;
            downloadLink.download = `slidegate_stock_report_${dd}_${mm}_${yyyy}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }).catch(error => {
            console.error('Error capturing table image:', error);
            alert('Sorry, there was an error generating the image.');
        });
    });
});