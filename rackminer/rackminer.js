const RARITY_CLS = { 'I': 'rarity-I', 'II': 'rarity-II', 'III': 'rarity-III', 'IV': 'rarity-IV', 'V': 'rarity-V' };
const TARGET_STORAGE_KEY = 'rocoRackMinerTargetPH';
const TARGET_UNIT_STORAGE_KEY = 'rocoRackMinerTargetUnit';
const TARGET_NEAR_PCT = 95;
const TARGET_OVER_PCT = 100;

    const UNITS = [
        { label: 'GH/s', val: 0.000001 },
        { label: 'TH/s', val: 0.001    },
        { label: 'PH/s', val: 1        },
        { label: 'EH/s', val: 1000     },
        { label: 'ZH/s', val: 1000000  },
    ];

    function unitOptions(saved) {
        return UNITS.map(u => `<option value="${u.val}" ${saved == u.val ? 'selected' : ''}>${u.label}</option>`).join('');
    }

    function rarityOptions(saved) {
        return ['I','II','III','IV','V'].map(k =>
            `<option value="${k}" ${saved == k ? 'selected' : ''}>${k}</option>`
        ).join('');
    }

    function updateRarityColor(select) {
        const cls = RARITY_CLS[select.value] || 'rarity-I';
        select.className = 'm-rarity ' + cls;
        const nameInput = select.closest('.miner-row').querySelector('.m-name');
        if (nameInput) nameInput.className = 'm-name ' + cls;
    }

    let rackCount = 0;

    function addRack(data = null) {
        rackCount++;
        const id = Date.now() + Math.random();
        const div = document.createElement('div');
        div.className = 'rack-box';
        div.id = `rack_${id}`;
        div.dataset.num = rackCount;
        div.innerHTML = `
            <div class="rack-header">
                <span class="rack-title">[RACK] ${rackCount}</span>
                <div class="rack-boost-wrap">
                    <input type="number" class="r-bonus" value="${data ? data.bonus : 0}" oninput="solve()">
                    <span>% RACK BOOST</span>
                </div>
            </div>
            <div class="col-heads">
                <span class="col-head">RARITY</span>
                <span class="col-head">MINER NAME</span>
                <span class="col-head">POWER</span>
                <span class="col-head">UNIT</span>
                <span class="col-head">BONUS %</span>
                <span></span>
            </div>
            <div class="miners-wrap" id="miners_${id}"></div>
            <div class="rack-footer">
                <button class="btn-add-miner" onclick="addMiner('${id}'); solve();">+ ADD MINER</button>
                <button class="btn-del-rack" onclick="this.closest('.rack-box').remove(); renumberRacks(); solve();">X DELETE RACK</button>
            </div>
        `;
        document.getElementById('rackContainer').appendChild(div);
        if (data && data.miners) {
            data.miners.forEach(m => addMiner(id, m));
        } else {
            addMiner(id);
        }
    }

    function renumberRacks() {
        let n = 0;
        document.querySelectorAll('.rack-box').forEach(rack => {
            n++;
            rack.querySelector('.rack-title').textContent = '[RACK] ' + n;
        });
        rackCount = n;
    }

    function addMiner(rId, data = null) {
        const container = document.getElementById(`miners_${rId}`);
        const wrapper = document.createElement('div');
        wrapper.className = 'miner-wrapper';
        const savedUnit = data ? data.unit : 1;
        const savedRarity = data ? (data.tier || 'I') : 'I';
        const cls = RARITY_CLS[savedRarity] || 'rarity-I';
        wrapper.innerHTML = `
            <div class="miner-row">
                <select class="m-rarity ${cls}" onchange="updateRarityColor(this); solve()">
                    ${rarityOptions(savedRarity)}
                </select>
                <input type="text" class="m-name ${cls}" value="${data ? data.name : ''}" placeholder="name..." oninput="solve()">
                <input type="number" class="m-pow" value="${data ? data.pow : ''}" placeholder="0.000" oninput="solve()">
                <select class="m-unit" onchange="solve()">
                    ${unitOptions(savedUnit)}
                </select>
                <input type="number" class="m-bonus" value="${data ? data.bonus : ''}" placeholder="0.00" oninput="solve()">
                <button class="del-miner" onclick="this.closest('.miner-wrapper').remove(); solve();">X</button>
            </div>
            <div class="lock-indicator">WARNING DUPLICATE RARITY - 0% BONUS</div>
        `;
        container.appendChild(wrapper);
    }

    function fmt(ph) {
        if (ph >= 1000000) return (ph / 1000000).toFixed(3) + ' ZH/s';
        if (ph >= 1000)    return (ph / 1000).toFixed(3) + ' EH/s';
        if (ph >= 1)       return ph.toFixed(3) + ' PH/s';
        if (ph >= 0.001)   return (ph * 1000).toFixed(3) + ' TH/s';
        return (ph * 1000000).toFixed(3) + ' GH/s';
    }

    function fmtPHOnly(ph) {
        const safeVal = Number.isFinite(ph) && ph >= 0 ? ph : 0;
        return safeVal.toFixed(3) + ' PH/s';
    }

    function fmtTargetUnitValue(value, unitLabel) {
        const safeVal = Number.isFinite(value) && value >= 0 ? value : 0;
        return safeVal.toFixed(3) + ' ' + unitLabel;
    }

    function updateTargetProgress(totalPH) {
        const targetInput = document.getElementById('targetPowerValue');
        const targetUnitSelect = document.getElementById('targetPowerUnit');
        const targetFill = document.getElementById('targetFill');
        const targetLine = document.getElementById('targetLine');
        if (!targetInput || !targetUnitSelect || !targetFill || !targetLine) return;

        const stateClasses = ['target-state-safe', 'target-state-near', 'target-state-over'];
        function setTargetState(stateClass) {
            targetLine.classList.remove(...stateClasses);
            targetFill.classList.remove(...stateClasses);
            targetLine.classList.add(stateClass);
            targetFill.classList.add(stateClass);
        }

        const targetValue = Math.max(parseFloat(targetInput.value) || 0, 0);
        const targetUnit = Math.max(parseFloat(targetUnitSelect.value) || 1, 1);
        const targetUnitLabel = targetUnitSelect.options[targetUnitSelect.selectedIndex]?.text || 'PH/s';
        const targetPH = targetValue * targetUnit;
        const safeTotalPH = Math.max(totalPH || 0, 0);

        if (targetPH <= 0) {
            targetFill.style.width = '0%';
            setTargetState('target-state-safe');
            targetLine.innerText = 'ESTIMATED ' + fmtPHOnly(safeTotalPH) + ' / TARGET ' + fmtTargetUnitValue(0, targetUnitLabel) + ' (0.00%)';
            return;
        }

        const rawPct = (safeTotalPH / targetPH) * 100;
        const barPct = Math.max(0, Math.min(rawPct, 100));
        targetFill.style.width = barPct.toFixed(2) + '%';

        if (rawPct >= TARGET_OVER_PCT) {
            setTargetState('target-state-over');
            targetLine.innerText = 'WARNING TARGET REACHED/OVER: ' + fmtPHOnly(safeTotalPH) + ' / ' + fmtTargetUnitValue(targetValue, targetUnitLabel) + ' (' + rawPct.toFixed(2) + '%)';
            return;
        }

        if (rawPct >= TARGET_NEAR_PCT) {
            setTargetState('target-state-near');
            targetLine.innerText = 'CAUTION NEAR TARGET: ' + fmtPHOnly(safeTotalPH) + ' / ' + fmtTargetUnitValue(targetValue, targetUnitLabel) + ' (' + rawPct.toFixed(2) + '%)';
            return;
        }

        setTargetState('target-state-safe');
        targetLine.innerText = 'ESTIMATED ' + fmtPHOnly(safeTotalPH) + ' / TARGET ' + fmtTargetUnitValue(targetValue, targetUnitLabel) + ' (' + rawPct.toFixed(2) + '%)';
    }

    function solve() {
        let totalRawPH = 0, totalRackBonusPH = 0, totalUniqueBonusPct = 0;
        let globalRegistry = new Set();
        let exportData = [];

        document.querySelectorAll('.rack-box').forEach(rack => {
            const rBoost = (parseFloat(rack.querySelector('.r-bonus').value) || 0) / 100;
            let rackRawPH = 0;
            let minersArray = [];

            rack.querySelectorAll('.miner-row').forEach(row => {
                if (!row.querySelector('.m-rarity')) return;
                const tier = row.querySelector('.m-rarity').value;
                const name = row.querySelector('.m-name').value.trim().toLowerCase();
                const p = parseFloat(row.querySelector('.m-pow').value) || 0;
                const u = parseFloat(row.querySelector('.m-unit').value);
                const b = (parseFloat(row.querySelector('.m-bonus').value) || 0) / 100;
                const raw = p * u;
                rackRawPH += raw;

                const uid = `${name}_${tier}`;
                if (name !== '' && !globalRegistry.has(uid)) {
                    totalUniqueBonusPct += b;
                    globalRegistry.add(uid);
                    row.classList.remove('is-locked');
                } else if (name !== '') {
                    row.classList.add('is-locked');
                } else {
                    totalUniqueBonusPct += b;
                }
                minersArray.push({ tier, name: row.querySelector('.m-name').value, pow: p, unit: u, bonus: b * 100 });
            });

            totalRawPH += rackRawPH;
            totalRackBonusPH += rackRawPH * rBoost;
            exportData.push({ bonus: rBoost * 100, miners: minersArray });
        });

        const bonusValPH = (totalRawPH + totalRackBonusPH) * totalUniqueBonusPct;
        const total = totalRawPH + totalRackBonusPH + bonusValPH;

        document.getElementById('dMiners').innerText = fmt(totalRawPH);
        document.getElementById('dRack').innerText = fmt(totalRackBonusPH);
        document.getElementById('dBonus').innerText = fmt(bonusValPH);
        document.getElementById('dBonusPct').innerText = '+' + (totalUniqueBonusPct * 100).toFixed(2) + '%';
        document.getElementById('dTotal').innerText = fmt(total);
        updateTargetProgress(total);

        const targetInput = document.getElementById('targetPowerValue');
        const targetUnitSelect = document.getElementById('targetPowerUnit');
        if (targetInput && targetUnitSelect) {
            const targetValue = Math.max(parseFloat(targetInput.value) || 0, 0);
            const targetUnit = Math.max(parseFloat(targetUnitSelect.value) || 1, 1);
            localStorage.setItem(TARGET_STORAGE_KEY, String(targetValue));
            localStorage.setItem(TARGET_UNIT_STORAGE_KEY, String(targetUnit));
        }

        localStorage.setItem('rocoRackMiner', JSON.stringify(exportData));
        const tag = document.getElementById('syncTag');
        tag.style.opacity = '1';
        setTimeout(() => { tag.style.opacity = '0'; }, 1000);
    }

    window.onload = () => {
        const saved = JSON.parse(localStorage.getItem('rocoRackMiner'));
        const targetInput = document.getElementById('targetPowerValue');
        const targetUnitSelect = document.getElementById('targetPowerUnit');
        const savedTarget = parseFloat(localStorage.getItem(TARGET_STORAGE_KEY));
        if (targetInput && Number.isFinite(savedTarget) && savedTarget >= 0) {
            targetInput.value = savedTarget;
        }

        const savedTargetUnit = parseFloat(localStorage.getItem(TARGET_UNIT_STORAGE_KEY));
        if (targetUnitSelect && Number.isFinite(savedTargetUnit) && savedTargetUnit > 0) {
            targetUnitSelect.value = String(savedTargetUnit);
        }

        if (saved && saved.length > 0) {
            saved.forEach(r => addRack(r));
        } else {
            addRack();
        }
        solve();
    };
