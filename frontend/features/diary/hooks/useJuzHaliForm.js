// C:\quran-similarity-app\frontend\src\features\diary\hooks\useJuzzHaliForm.js
// Fix #14: now a thin wrapper around the shared useRangeForm hook.
// All existing call-sites that import useJuzHaliForm continue to work unchanged.

import useRangeForm from './useRangeForm';

export default function useJuzHaliForm() {
    return useRangeForm('juz_hali');
}