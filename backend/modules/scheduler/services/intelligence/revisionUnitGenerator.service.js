const pageAnalysisRepo = require('../../../../repositories/scheduler/pageAnalysis.repository');
const revisionUnitRepo = require('../../../../repositories/scheduler/revisionUnit.repository');
const murajaahGenerator = require('./generators/murajaahGenerator');
const juzHaliGenerator = require('./generators/juzHaliGenerator');
const jadeedGenerator = require('./generators/jadeedGenerator');

class RevisionUnitGeneratorService {
    /**
     * Generate revision units for all work types
     */
    async generateAll(userId, weeklyCycle, currentSipara, userProgress) {
        const pageAnalyses = await pageAnalysisRepo.getByUserId(userId);
        
        if (!pageAnalyses || pageAnalyses.length === 0) {
            return [];
        }

        // Generate units for each work type
        const murajaahUnits = await murajaahGenerator.generate(userId, pageAnalyses, weeklyCycle);
        const juzHaliUnits = await juzHaliGenerator.generate(userId, pageAnalyses, currentSipara);
        const jadeedUnits = await jadeedGenerator.generate(userId, userProgress);

        // Combine all units
        const allUnits = [...murajaahUnits, ...juzHaliUnits, ...jadeedUnits];

        // Save to database
        for (const unit of allUnits) {
            await revisionUnitRepo.create(unit);
        }

        return allUnits;
    }

    async generateMurajaah(userId, pageAnalyses, weeklyCycle) {
        return await murajaahGenerator.generate(userId, pageAnalyses, weeklyCycle);
    }

    async generateJuzHali(userId, pageAnalyses, currentSipara) {
        return await juzHaliGenerator.generate(userId, pageAnalyses, currentSipara);
    }

    async generateJadeed(userId, userProgress) {
        return await jadeedGenerator.generate(userId, userProgress);
    }

    async getByUserId(userId, filters = {}) {
        return await revisionUnitRepo.getByUserId(userId, filters);
    }

    async getById(id) {
        return await revisionUnitRepo.getById(id);
    }

    async update(id, unit) {
        return await revisionUnitRepo.update(id, unit);
    }

    async delete(id) {
        return await revisionUnitRepo.delete(id);
    }

    async deleteByUserId(userId) {
        return await revisionUnitRepo.deleteByUserId(userId);
    }
}

module.exports = new RevisionUnitGeneratorService();
