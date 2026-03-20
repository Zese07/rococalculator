const RARITY_CLS = { 'I': 'rarity-I', 'II': 'rarity-II', 'III': 'rarity-III', 'IV': 'rarity-IV', 'V': 'rarity-V' };
const RACK_STORAGE_KEY = 'rocoRackMiner';
const TARGET_VALUE_STORAGE_KEY = 'rocoRackMinerTargetValue';
const LEGACY_TARGET_STORAGE_KEY = 'rocoRackMinerTargetPH';
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

    function getValidUnitVal(unit) {
        const val = parseFloat(unit);
        if (UNITS.some(u => u.val === val)) return val;
        return 1;
    }

    function getRackBonusInBonusFactor(totalMinerSlots) {
        const safeSlots = Math.max(parseFloat(totalMinerSlots) || 0, 0);
        return safeSlots * 0.012;
    }

    function sanitizeMiner(miner) {
        const tier = ['I', 'II', 'III', 'IV', 'V'].includes(miner?.tier) ? miner.tier : 'I';
        const name = typeof miner?.name === 'string' ? miner.name : '';
        const pow = Math.max(parseFloat(miner?.pow) || 0, 0);
        const unit = getValidUnitVal(miner?.unit);
        const bonus = Math.max(parseFloat(miner?.bonus) || 0, 0);
        return { tier, name, pow, unit, bonus };
    }

    function sanitizeRack(rack) {
        const bonus = Math.max(parseFloat(rack?.bonus) || 0, 0);
        const miners = Array.isArray(rack?.miners) ? rack.miners.map(sanitizeMiner) : [];
        return { bonus, miners };
    }

    function sanitizeRackList(input) {
        if (!Array.isArray(input)) return [];
        return input.map(sanitizeRack);
    }

    let pendingConfirmAction = null;

    function applyOverlayFallback(overlay) {
        if (!overlay) return;
        const modal = overlay.querySelector('.confirm-modal');

        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '10001';
        overlay.style.background = 'rgba(10, 12, 16, 0.84)';
        overlay.style.padding = '18px';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        if (!overlay.classList.contains('is-open')) {
            overlay.style.display = 'none';
        }

        if (!modal) return;
        modal.style.width = '100%';
        modal.style.maxWidth = '520px';
    }

    function closeDeleteConfirm() {
        const overlay = document.getElementById('deleteConfirmOverlay');
        if (!overlay) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.display = 'none';
        pendingConfirmAction = null;
    }

    function openDeleteConfirm(title, message, onConfirm) {
        const overlay = document.getElementById('deleteConfirmOverlay');
        const titleEl = document.getElementById('deleteConfirmTitle');
        const messageEl = document.getElementById('deleteConfirmMessage');
        const confirmBtn = document.getElementById('deleteConfirmConfirm');
        if (!overlay || !titleEl || !messageEl || typeof onConfirm !== 'function') {
            if (typeof onConfirm === 'function') onConfirm();
            return;
        }

        titleEl.textContent = title;
        messageEl.textContent = message;
        pendingConfirmAction = onConfirm;

        applyOverlayFallback(overlay);
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.style.display = 'flex';
        if (confirmBtn) confirmBtn.focus();
    }

    function confirmDeleteAction() {
        if (typeof pendingConfirmAction === 'function') {
            const action = pendingConfirmAction;
            closeDeleteConfirm();
            action();
            return;
        }
        closeDeleteConfirm();
    }

    function initDeleteConfirmModal() {
        const overlay = document.getElementById('deleteConfirmOverlay');
        const cancelBtn = document.getElementById('deleteConfirmCancel');
        const confirmBtn = document.getElementById('deleteConfirmConfirm');
        if (!overlay || !cancelBtn || !confirmBtn) return;

        applyOverlayFallback(overlay);

        cancelBtn.onclick = () => closeDeleteConfirm();
        confirmBtn.onclick = () => confirmDeleteAction();

        overlay.onclick = (event) => {
            if (event.target === overlay) closeDeleteConfirm();
        };

        document.addEventListener('keydown', (event) => {
            if (!overlay.classList.contains('is-open')) return;
            if (event.key === 'Escape') {
                closeDeleteConfirm();
                return;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                confirmDeleteAction();
            }
        });
    }

    function openHelpModal() {
        const overlay = document.getElementById('helpOverlay');
        const closeBtn = document.getElementById('helpModalClose');
        if (!overlay) return;
        applyOverlayFallback(overlay);
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        overlay.style.display = 'flex';
        if (closeBtn) closeBtn.focus();
    }

    function closeHelpModal() {
        const overlay = document.getElementById('helpOverlay');
        if (!overlay) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.display = 'none';
    }

    function initHelpModal() {
        const overlay = document.getElementById('helpOverlay');
        const closeBtn = document.getElementById('helpModalClose');
        if (!overlay || !closeBtn) return;

        applyOverlayFallback(overlay);

        closeBtn.onclick = () => closeHelpModal();

        overlay.onclick = (event) => {
            if (event.target === overlay) closeHelpModal();
        };

        document.addEventListener('keydown', (event) => {
            if (!overlay.classList.contains('is-open')) return;
            if (event.key === 'Escape' || event.key === 'Enter') {
                event.preventDefault();
                closeHelpModal();
            }
        });
    }

    function requestDeleteRack(button) {
        const rackBox = button?.closest('.rack-box');
        if (!rackBox) return;

        const rackLabel = rackBox.querySelector('.rack-title')?.textContent || '[RACK]';
        const minerCount = rackBox.querySelectorAll('.miner-row').length;
        const slotText = minerCount === 1 ? '1 miner slot' : `${minerCount} miner slots`;
        const message = `${rackLabel} contains ${slotText}. This action cannot be undone.`;

        openDeleteConfirm('DELETE RACK?', message, () => {
            rackBox.remove();
            renumberRacks();
            solve();
        });
    }

    function requestDeleteMiner(button) {
        const minerWrapper = button?.closest('.miner-wrapper');
        if (!minerWrapper) return;

        const rackBox = button.closest('.rack-box');
        const rackLabel = rackBox?.querySelector('.rack-title')?.textContent || '[RACK]';
        const message = `Remove this miner slot from ${rackLabel}? This action cannot be undone.`;

        openDeleteConfirm('DELETE MINER?', message, () => {
            minerWrapper.remove();
            solve();
        });
    }

    function triggerImportRackMinerData() {
        const fileInput = document.getElementById('importRackMinerFile');
        if (!fileInput) return;
        fileInput.click();
    }

    async function exportRackMinerData() {
        solve();

        const targetInput = document.getElementById('targetPowerValue');
        const targetUnitSelect = document.getElementById('targetPowerUnit');
        const targetValue = Math.max(parseFloat(targetInput?.value) || 0, 0);
        const targetUnit = getValidUnitVal(targetUnitSelect?.value);

        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            racks: sanitizeRackList(JSON.parse(localStorage.getItem(RACK_STORAGE_KEY) || '[]')),
            target: {
                value: targetValue,
                unit: targetUnit
            }
        };

        const payloadText = JSON.stringify(payload, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `rackminer-backup-${timestamp}.json`;
        const blob = new Blob([payloadText], { type: 'application/json' });

        const canShareFiles =
            typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function' &&
            typeof navigator.canShare === 'function';

        if (canShareFiles) {
            try {
                const file = new File([blob], fileName, { type: 'application/json' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'RackMiner Backup',
                        text: 'RackMiner export file',
                        files: [file]
                    });
                    return;
                }
            } catch (error) {
                if (error?.name === 'AbortError') return;
            }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Delay cleanup to avoid occasional download race conditions on mobile browsers.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function importRackMinerData(event) {
        const file = event?.target?.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(String(reader.result || '{}'));
                const importedRacks = Array.isArray(parsed) ? parsed : parsed.racks;
                const safeRacks = sanitizeRackList(importedRacks);

                const rackContainer = document.getElementById('rackContainer');
                if (!rackContainer) return;
                rackContainer.innerHTML = '';
                rackCount = 0;

                safeRacks.forEach(r => addRack(r));
                if (safeRacks.length === 0) addRack();

                const targetInput = document.getElementById('targetPowerValue');
                const targetUnitSelect = document.getElementById('targetPowerUnit');
                if (parsed?.target && targetInput && targetUnitSelect) {
                    const targetValue = Math.max(parseFloat(parsed.target.value) || 0, 0);
                    const targetUnit = getValidUnitVal(parsed.target.unit);
                    targetInput.value = targetValue;
                    targetUnitSelect.value = String(targetUnit);
                }

                solve();
            } catch (error) {
                alert('Invalid file format. Please import a valid RackMiner JSON export.');
                console.error(error);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
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
                    <span>% RACK BONUS</span>
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
                <button class="btn-del-rack" onclick="requestDeleteRack(this)">X DELETE RACK</button>
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
                <input type="text" class="m-name ${cls}" value="${data ? data.name : ''}" placeholder="Name..." oninput="solve()">
                <input type="number" class="m-pow" value="${data ? data.pow : ''}" placeholder="0.00 (Power)" oninput="solve()">
                <select class="m-unit" onchange="solve()">
                    ${unitOptions(savedUnit)}
                </select>
                <input type="number" class="m-bonus" value="${data ? data.bonus : ''}" placeholder="0.00 (Bonus%)" oninput="solve()">
                <button class="del-miner" onclick="requestDeleteMiner(this)">X</button>
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
        let totalMinerSlots = 0;
        let globalRegistry = new Set();
        let exportData = [];

        document.querySelectorAll('.rack-box').forEach(rack => {
            const rBoost = (parseFloat(rack.querySelector('.r-bonus').value) || 0) / 100;
            let rackRawPH = 0;
            let minersArray = [];

            const minerRows = rack.querySelectorAll('.miner-row');

            minerRows.forEach(row => {
                if (!row.querySelector('.m-rarity')) return;
                const tier = row.querySelector('.m-rarity').value;
                const name = row.querySelector('.m-name').value.trim().toLowerCase();
                const powerRaw = row.querySelector('.m-pow').value.trim();
                const bonusRaw = row.querySelector('.m-bonus').value.trim();
                const p = parseFloat(powerRaw) || 0;
                const u = parseFloat(row.querySelector('.m-unit').value);
                const b = (parseFloat(bonusRaw) || 0) / 100;
                const raw = p * u;
                rackRawPH += raw;

                const hasPowerForCount = powerRaw !== '' && p > 0;
                const hasBonusForCount = bonusRaw !== '' && Number.isFinite(parseFloat(bonusRaw));
                if (hasPowerForCount && hasBonusForCount) {
                    totalMinerSlots += 1;
                }

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

        const rackBonusInBonusFactor = getRackBonusInBonusFactor(totalMinerSlots);
        const bonusBasePH = totalRawPH + (totalRackBonusPH * rackBonusInBonusFactor);
        const bonusValPH = bonusBasePH * totalUniqueBonusPct;
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
            localStorage.setItem(TARGET_VALUE_STORAGE_KEY, String(targetValue));
            localStorage.setItem(TARGET_UNIT_STORAGE_KEY, String(targetUnit));
        }

        localStorage.setItem(RACK_STORAGE_KEY, JSON.stringify(exportData));
        const tag = document.getElementById('syncTag');
        tag.style.opacity = '1';
        setTimeout(() => { tag.style.opacity = '0'; }, 1000);
    }

    window.onload = () => {
        initDeleteConfirmModal();
        initHelpModal();
        const saved = JSON.parse(localStorage.getItem(RACK_STORAGE_KEY));
        const targetInput = document.getElementById('targetPowerValue');
        const targetUnitSelect = document.getElementById('targetPowerUnit');
        const savedTargetRaw = localStorage.getItem(TARGET_VALUE_STORAGE_KEY);
        const legacyTargetRaw = localStorage.getItem(LEGACY_TARGET_STORAGE_KEY);
        const savedTarget = parseFloat(savedTargetRaw ?? legacyTargetRaw);
        if (targetInput && Number.isFinite(savedTarget) && savedTarget >= 0) {
            targetInput.value = savedTarget;
            if (savedTargetRaw === null) {
                localStorage.setItem(TARGET_VALUE_STORAGE_KEY, String(savedTarget));
            }
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
