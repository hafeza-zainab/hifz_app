// C:\quran-similarity-app\frontend\src\features\diary\hooks\useJadeedForm.js
// Fix #14: now a thin wrapper around the shared useRangeForm hook.
// All existing call-sites that import useJadeedForm continue to work unchanged.

import useRangeForm from './useRangeForm';

export default function useJadeedForm() {
    return useRangeForm('jadeed');
}