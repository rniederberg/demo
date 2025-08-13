// BLA BLA BLA
document.addEventListener('DOMContentLoaded', () => {
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');
    let originalData = [];
    let headers = [];

    const init = async () => {
        try {
            // Using mock.json as a stable data source
            const response = await fetch('mock.json');
            const data = await response.json();
            originalData = Object.values(data.campz);
            headers = getHeaders(originalData);
            render();
        } catch (error) {
            console.error('Error fetching data:', error);
            tableBody.innerHTML = `<tr><td colspan="100%">Error loading data.</td></tr>`;
        }
    };

    const getHeaders = (data) => {
        const allKeys = new Set(data.flatMap(item => Object.keys(item)));
        // return Array.from(allKeys);
        const keysArr = Array.from(allKeys);
        const orderHeaders = [
            'Total Goal',
            'Placement',
            'ID',
        ]; // reverse order
        orderHeaders.forEach(headerName => {
            const index = keysArr.findIndex(e => e === headerName);
            if (index > -1) {
                const [item] = keysArr.splice(index, 1);
                keysArr.unshift(item);
            }
        });
        return keysArr;
    };

    const formatCellValue = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number' && value % 1 !== 0) {
            return value.toFixed(3);
        }
        return value;
    };

    // Main render function to orchestrate the build
    const render = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const sort = getSortFromUrl(urlParams);
        const filteredData = applyFiltersAndSort(urlParams);
        
        renderHeaders(sort);
        renderBody(filteredData);
        setFilterInputsFromUrl(urlParams);
    };

    const applyFiltersAndSort = (urlParams) => {
        const filters = getFiltersFromUrl(urlParams);
        const sort = getSortFromUrl(urlParams);

        let processedData = [...originalData].filter(item => {
            return headers.every(header => {
                const filterValue = filters[header.toLowerCase()] || '';
                const itemValue = String(item[header] ?? '').toLowerCase();
                return itemValue.includes(filterValue);
            });
        });

        if (sort.key) {
            processedData.sort((a, b) => {
                const valA = a[sort.key];
                const valB = b[sort.key];

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sort.order === 'asc' ? valA - valB : valB - valA;
                }
                return sort.order === 'asc' 
                    ? String(valA).localeCompare(String(valB)) 
                    : String(valB).localeCompare(String(valA));
            });
        }
        return processedData;
    };
    
    const renderHeaders = (sort) => {
        tableHead.innerHTML = '';
        const titleRow = document.createElement('tr');
        const filterRow = document.createElement('tr');

        headers.forEach(header => {
            const titleTh = document.createElement('th');
            titleTh.className = 'title-cell';
            titleTh.dataset.sortKey = header;
            titleTh.innerHTML = `<span>${header}</span><i class="bi"></i>`;
            const sortIcon = titleTh.querySelector('.bi');
            sortIcon.className = 'bi bi-arrow-down-up sort-icon';

            if (header === sort.key) {
                sortIcon.classList.add('active');
                sortIcon.classList.toggle('bi-arrow-down-up', false);
                sortIcon.classList.toggle(sort.order === 'asc' ? 'bi-sort-up' : 'bi-sort-down', true);
            }
            titleRow.appendChild(titleTh);
            
            const filterTh = document.createElement('th');
            filterTh.className = 'filter-cell';
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control form-control-sm filter-input';
            input.dataset.filter = header;
            input.addEventListener('input', updateUrlAndRender);
            filterTh.appendChild(input);
            filterRow.appendChild(filterTh);
        });
        
        titleRow.addEventListener('click', (e) => {
            const headerCell = e.target.closest('.title-cell');
            if (headerCell) handleSort(headerCell.dataset.sortKey);
        });

        tableHead.appendChild(titleRow);
        tableHead.appendChild(filterRow);
    };

    const renderBody = (data) => {
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${headers.length}">No matching records found.</td></tr>`;
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            if (item["Configuration Status"] === "Inactive") {
                row.classList.add('inactive-row');
            }
            headers.forEach(header => {
                const cell = document.createElement('td');
                cell.textContent = formatCellValue(item[header]);
                row.appendChild(cell);
            });
            tableBody.appendChild(row);
        });
    };

    const handleSort = (newSortKey) => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentSortKey = urlParams.get('sort');
        const currentSortOrder = urlParams.get('order') || 'asc';
        
        const newSortOrder = (currentSortKey === newSortKey && currentSortOrder === 'asc') ? 'desc' : 'asc';
        
        urlParams.set('sort', newSortKey);
        urlParams.set('order', newSortOrder);
        updateHistoryAndRender(urlParams);
    };

    // A single function to update URL from filters and re-render
    const updateUrlAndRender = () => {
        const urlParams = new URLSearchParams(window.location.search);
        document.querySelectorAll('.filter-input').forEach(input => {
            const key = `filter_${input.dataset.filter.toLowerCase()}`;
            if (input.value) {
                urlParams.set(key, input.value.toLowerCase());
            } else {
                urlParams.delete(key);
            }
        });
        updateHistoryAndRender(urlParams);
    };

    // Helper to update the URL in the browser history and trigger a re-render
    const updateHistoryAndRender = (urlParams) => {
        window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        render();
    }
    
    const getFiltersFromUrl = (urlParams) => Object.fromEntries(
        [...urlParams.entries()]
            .filter(([key]) => key.startsWith('filter_'))
            .map(([key, value]) => [key.replace('filter_', ''), value])
    );
    
    const getSortFromUrl = (urlParams) => ({
        key: urlParams.get('sort'),
        order: urlParams.get('order') || 'asc'
    });

    const setFilterInputsFromUrl = (urlParams) => {
        const filters = getFiltersFromUrl(urlParams);
        document.querySelectorAll('.filter-input').forEach(input => {
            input.value = filters[input.dataset.filter.toLowerCase()] || '';
        });
    };

    // Re-render when using browser back/forward buttons
    window.addEventListener('popstate', render);

    init();
});
