function calculate() {
    const warning = document.getElementById('warning');
    warning.style.display = 'none';
    warning.textContent = '';

    const numberInputs = document.querySelectorAll('input[type="number"]');
    for (const input of numberInputs) {
        const value = parseFloat(input.value);
        if (isNaN(value) || value < 0) {
            warning.textContent = 'Please enter non-negative values in all fields.';
            warning.style.display = 'block';
            return;
        }
    }

    const baseLoad = parseFloat(document.getElementById('baseLoad').value);
    const baseHours = parseFloat(document.getElementById('baseHours').value);

    const spaPower = parseFloat(document.getElementById('spaPower').value);
    const spaHours = parseFloat(document.getElementById('spaHours').value);
    const spaSimultaneous = parseInt(document.getElementById('spaSimultaneous').value);
    const spaUsage = document.getElementById('spaUsage').value;

    const evPower = parseFloat(document.getElementById('evPower').value);
    const evBattery = parseFloat(document.getElementById('evBattery').value);
    const evFrequency = document.getElementById('evFrequency').value;
    const evChargeAmount = parseFloat(document.getElementById('evChargeAmount').value) / 100;

    const poolPump = parseFloat(document.getElementById('poolPump').value);
    const poolPumpHours = parseFloat(document.getElementById('poolPumpHours').value);
    const poolHeater = parseFloat(document.getElementById('poolHeater').value);
    const poolHeaterHours = parseFloat(document.getElementById('poolHeaterHours').value);

    const backupHours = parseFloat(document.getElementById('backupHours').value);
    const efficiency = parseFloat(document.getElementById('efficiency').value) / 100;
    const depthDischarge = parseFloat(document.getElementById('depthDischarge').value) / 100;
    const safetyMargin = parseFloat(document.getElementById('safetyMargin').value) / 100;

    const baseEnergy = baseLoad * baseHours;

    let spaMultiplier = 1;
    if (spaUsage === 'winter') spaMultiplier = 1.5;
    if (spaUsage === 'evening') spaMultiplier = 0.8;
    const spaEnergy = spaPower * spaHours * spaSimultaneous * spaMultiplier;

    const evEnergyPerCharge = evBattery * evChargeAmount;
    let evFreqMultiplier = 1;
    if (evFrequency === 'alternate') evFreqMultiplier = 0.5;
    if (evFrequency === 'weekly') evFreqMultiplier = 0.35;
    const evEnergyDaily = evEnergyPerCharge * evFreqMultiplier;

    const poolEnergy = poolPump * poolPumpHours + poolHeater * poolHeaterHours;

    const totalDailyEnergy = baseEnergy + spaEnergy + evEnergyDaily + poolEnergy;

    const basePeak = baseLoad;
    const spaPeak = spaPower * spaSimultaneous;
    const evPeak = evPower;
    const poolPeak = poolPump + poolHeater;

    const maxConcurrentLoad = Math.max(
        basePeak + spaPeak,
        basePeak + evPeak,
        basePeak + poolPeak,
        basePeak + spaPeak * 0.5 + poolPump
    );

    const backupEnergy = maxConcurrentLoad * backupHours;

    const batteryCapacityRequired = (backupEnergy / efficiency / depthDischarge) * (1 + safetyMargin);

    const maxSupplyPower = 230 * 60 / 1000;
    const powerLimited = maxConcurrentLoad > maxSupplyPower;

    const resultContent = document.getElementById('resultContent');
    resultContent.textContent = '';

    const addResultItem = (label, value, strong = false) => {
        const item = document.createElement('div');
        item.className = 'result-item';
        const labelSpan = document.createElement('span');
        if (strong) {
            const strongEl = document.createElement('strong');
            strongEl.textContent = label;
            labelSpan.appendChild(strongEl);
        } else {
            labelSpan.textContent = label;
        }
        const valueSpan = document.createElement('span');
        valueSpan.className = 'result-value';
        valueSpan.textContent = value;
        item.appendChild(labelSpan);
        item.appendChild(valueSpan);
        resultContent.appendChild(item);
    };

    addResultItem('Daily Energy Consumption:', `${totalDailyEnergy.toFixed(1)} kWh/day`);
    addResultItem('• Base house load:', `${baseEnergy.toFixed(1)} kWh`);
    addResultItem(`• Spa pools (${spaSimultaneous} concurrent):`, `${spaEnergy.toFixed(1)} kWh`);
    addResultItem('• EV charging (avg/day):', `${evEnergyDaily.toFixed(1)} kWh`);
    addResultItem('• Swimming pool:', `${poolEnergy.toFixed(1)} kWh`);
    addResultItem('Peak Power Demand:', `${maxConcurrentLoad.toFixed(1)} kW`, true);
    addResultItem('Recommended Battery Capacity:', `${batteryCapacityRequired.toFixed(0)} kWh`, true);
    addResultItem('Backup duration:', `${backupHours} hours`);
    addResultItem('System efficiency considered:', `${(efficiency*100).toFixed(0)}%`);

    if (powerLimited) {
        const limitWarning = document.createElement('div');
        limitWarning.className = 'warning';
        limitWarning.textContent = `⚠️ Power Supply Limitation: Your peak demand (${maxConcurrentLoad.toFixed(1)}kW) exceeds your 60A supply limit (${maxSupplyPower.toFixed(1)}kW). Consider load management or upgrading your electrical supply.`;
        resultContent.appendChild(limitWarning);
    }

    const batteryOptions = [
        { size: 10, name: 'Small residential (Tesla Powerwall 2)' },
        { size: 20, name: 'Medium residential system' },
        { size: 30, name: 'Large residential system' },
        { size: 50, name: 'Premium whole-home backup' },
        { size: 75, name: 'Extended backup system' },
        { size: 100, name: 'Commercial-grade system' }
    ];

    let recommendedOption = batteryOptions.find(option => option.size >= batteryCapacityRequired);
    if (!recommendedOption) recommendedOption = batteryOptions[batteryOptions.length - 1];

    const recommendationDiv = document.createElement('div');
    recommendationDiv.className = 'tip';
    recommendationDiv.textContent = `💡 Recommendation: Consider a ${recommendedOption.size}kWh system (${recommendedOption.name}). This provides ${backupHours}-hour backup with ${(safetyMargin*100).toFixed(0)}% safety margin.`;
    resultContent.appendChild(recommendationDiv);

    const nzDiv = document.createElement('div');
    nzDiv.className = 'tip';
    const nzStrong = document.createElement('strong');
    nzStrong.textContent = '🔧 NZ-Specific Notes:';
    nzDiv.appendChild(nzStrong);
    const nzNotes = [
        `Your 230V/60A supply provides up to ${maxSupplyPower.toFixed(1)}kW`,
        'Consider time-of-use tariffs to optimize battery charging',
        'Check with your electricity retailer about battery feed-in tariffs',
        'Ensure compliance with AS/NZS 4777 grid connection standards'
    ];
    nzNotes.forEach(note => {
        const line = document.createElement('div');
        line.textContent = `• ${note}`;
        nzDiv.appendChild(line);
    });
    resultContent.appendChild(nzDiv);

    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('calculateBtn').addEventListener('click', calculate);
    setTimeout(calculate, 100);
});
