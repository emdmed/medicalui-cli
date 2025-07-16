export const BloodOxygenValidations = {
  spo2: {
    isValid: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 70 && num <= 100;
    },

    isLow: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num < 95;
    },

    isCritical: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num < 90;
    },

    getErrorMessage: (value) => {
      if (!value || value === "") return null;
      
      const num = parseFloat(value);
      if (isNaN(num)) return "Please enter a valid number";
      if (num < 70) return "SpO2 value must be at least 70%";
      if (num > 100) return "SpO2 value cannot exceed 100%";
      
      return null;
    },

    getSeverity: (value) => {
      if (!BloodOxygenValidations.spo2.isValid(value)) return 'invalid';
      
      const num = parseFloat(value);
      if (num < 90) return 'critical';
      if (num < 95) return 'low';
      return 'normal';
    },

    MIN_VALUE: 70,
    MAX_VALUE: 100,
    LOW_THRESHOLD: 95,
    CRITICAL_THRESHOLD: 90
  },

  fio2: {
    isValid: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num >= 21 && num <= 100;
    },

    isSupplemental: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num > 21;
    },

    isRoomAir: (value) => {
      const num = parseFloat(value);
      return !isNaN(num) && num === 21;
    },

    getErrorMessage: (value) => {
      if (!value || value === "") return null;
      
      const num = parseFloat(value);
      if (isNaN(num)) return "Please enter a valid number";
      if (num < 21) return "FiO2 value must be at least 21%";
      if (num > 100) return "FiO2 value cannot exceed 100%";
      
      return null;
    },

    getDeliveryMethod: (value) => {
      if (!BloodOxygenValidations.fio2.isValid(value)) return 'invalid';
      
      const num = parseFloat(value);
      if (num === 21) return 'room air';
      if (num <= 40) return 'low flow';
      return 'high flow';
    },

    MIN_VALUE: 21,
    MAX_VALUE: 100,
    DEFAULT_VALUE: 21,
    ROOM_AIR_VALUE: 21
  },

  utils: {
    toNumber: (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    },

    formatNumber: (value, decimals = 0) => {
      const num = parseFloat(value);
      return isNaN(num) ? '' : num.toFixed(decimals);
    },

    isEmpty: (value) => {
      return value === null || value === undefined || value === '';
    },

    calculateRatio: (spo2Value, fio2Value) => {
      const spo2 = parseFloat(spo2Value);
      const fio2 = parseFloat(fio2Value);
      
      if (isNaN(spo2) || isNaN(fio2) || fio2 === 0) return null;
      
      return (spo2 / fio2).toFixed(2);
    }
  }
};

export const hasValidBloodOxygenInput = BloodOxygenValidations.spo2.isValid;
export const hasValidFio2Input = BloodOxygenValidations.fio2.isValid;

export const { spo2, fio2, utils } = BloodOxygenValidations;

export default BloodOxygenValidations;