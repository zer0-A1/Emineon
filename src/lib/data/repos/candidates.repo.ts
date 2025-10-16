import { query } from '@/lib/db/neon-client';
import { CandidateDTO, ListCandidatesInput } from '@/lib/data/dto/candidate.dto';

function toSafeLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit <= 0) return 50;
  return Math.min(limit, 500);
}

function toSafeOffset(offset?: number): number {
  if (!offset || !Number.isFinite(offset) || offset < 0) return 0;
  return offset;
}

export const CandidatesRepo = {
  async list(input: ListCandidatesInput = {}): Promise<CandidateDTO[]> {
    const limit = toSafeLimit(input.limit);
    const offset = toSafeOffset(input.offset);
    const orderBy = (input.sort === 'lastUpdated' ? 'updated_at' : 'created_at');
    const camelOrderBy = (input.sort === 'lastUpdated' ? '"updatedAt"' : '"createdAt"');

    const run = async <T = any>(sqlSnake: string, sqlCamel: string, params: any[]): Promise<T[]> => {
      try {
        return await query<T>(sqlSnake, params);
      } catch (err: any) {
        // Fallback to camelCase schema when snake_case columns are missing locally
        if (err?.code === '42703') {
          try {
            return await query<T>(sqlCamel, params);
          } catch (err2: any) {
            // If camel query still fails due to ORDER BY "updatedAt" not existing, try "createdAt"
            if (err2?.code === '42703' && sqlCamel.includes('"updatedAt"')) {
              const sqlCamelCreated = sqlCamel.replace(/"updatedAt"/g, '"createdAt"');
              return await query<T>(sqlCamelCreated, params);
            }
            throw err2;
          }
        }
        throw err;
      }
    };
    const orderDir = (input.order === 'asc' ? 'ASC' : 'DESC');

    if (input.ids && input.ids.length > 0) {
      const sqlSnake = `SELECT
           id,
           first_name AS "firstName",
           last_name AS "lastName",
           email,
           phone,
           current_title AS "currentTitle",
           current_location AS "currentLocation",
           summary,
           experience_years AS "experienceYears",
           technical_skills AS "technicalSkills",
           soft_skills AS "softSkills",
           programming_languages AS "programmingLanguages",
           frameworks,
           tools_and_platforms AS "toolsAndPlatforms",
           methodologies,
           original_cv_url AS "originalCvUrl",
           original_cv_file_name AS "originalCvFileName",
           original_cv_uploaded_at AS "originalCvUploadedAt",
           education_level AS "educationLevel",
           universities,
           degrees,
           graduation_year AS "graduationYear",
           certifications,
           expected_salary AS "expectedSalary",
           preferred_contract_type AS "preferredContractType",
           freelancer,
           remote_preference AS "remotePreference",
           relocation_willingness AS "relocationWillingness",
           available_from AS "availableFrom",
           seniority_level AS "seniorityLevel",
           professional_headline AS "professionalHeadline",
           spoken_languages AS "spokenLanguages",
           primary_industry AS "primaryIndustry",
           functional_domain AS "functionalDomain",
           tags,
           source,
           matching_score AS "matchingScore",
           status,
           created_at AS "createdAt",
           updated_at AS "lastUpdated"
         FROM candidates
         WHERE (archived = false OR archived IS NULL) AND id = ANY($1)
         ORDER BY ${orderBy} ${orderDir}
         LIMIT $2 OFFSET $3`;
      const sqlCamel = `SELECT
           id,
           "firstName" AS "firstName",
           "lastName" AS "lastName",
           email,
           phone,
           "currentTitle" AS "currentTitle",
           "currentLocation" AS "currentLocation",
           summary,
           "experienceYears" AS "experienceYears",
           "technicalSkills" AS "technicalSkills",
           "softSkills" AS "softSkills",
           "programmingLanguages" AS "programmingLanguages",
           frameworks,
           "toolsAndPlatforms" AS "toolsAndPlatforms",
           methodologies,
           "originalCvUrl" AS "originalCvUrl",
           "originalCvFileName" AS "originalCvFileName",
           "originalCvUploadedAt" AS "originalCvUploadedAt",
           "educationLevel" AS "educationLevel",
           universities,
           degrees,
           "graduationYear" AS "graduationYear",
           certifications,
           "expectedSalary" AS "expectedSalary",
           "preferredContractType" AS "preferredContractType",
           freelancer,
           "remotePreference" AS "remotePreference",
           "relocationWillingness" AS "relocationWillingness",
           "availableFrom" AS "availableFrom",
           "seniorityLevel" AS "seniorityLevel",
           "professionalHeadline" AS "professionalHeadline",
           "spokenLanguages" AS "spokenLanguages",
           "primaryIndustry" AS "primaryIndustry",
           "functionalDomain" AS "functionalDomain",
           tags,
           source,
           "matchingScore" AS "matchingScore",
           status,
           "createdAt" AS "createdAt",
           "updatedAt" AS "lastUpdated"
         FROM candidates
         WHERE (archived = false OR archived IS NULL) AND id = ANY($1)
         ORDER BY ${camelOrderBy} ${orderDir}
         LIMIT $2 OFFSET $3`;
      const rows = await run<any>(sqlSnake, sqlCamel, [input.ids, limit, offset]);
      return rows as CandidateDTO[];
    }

    if (input.search && input.search.trim()) {
      const like = `%${input.search.trim()}%`;
      const sqlSnake = `SELECT
           id,
           first_name AS "firstName",
           last_name AS "lastName",
           email,
           phone,
           current_title AS "currentTitle",
           current_location AS "currentLocation",
           summary,
           experience_years AS "experienceYears",
           technical_skills AS "technicalSkills",
           soft_skills AS "softSkills",
           programming_languages AS "programmingLanguages",
           frameworks,
           tools_and_platforms AS "toolsAndPlatforms",
           methodologies,
           original_cv_url AS "originalCvUrl",
           original_cv_file_name AS "originalCvFileName",
           original_cv_uploaded_at AS "originalCvUploadedAt",
           education_level AS "educationLevel",
           universities,
           degrees,
           graduation_year AS "graduationYear",
           certifications,
           expected_salary AS "expectedSalary",
           preferred_contract_type AS "preferredContractType",
           freelancer,
           remote_preference AS "remotePreference",
           relocation_willingness AS "relocationWillingness",
           available_from AS "availableFrom",
           seniority_level AS "seniorityLevel",
           professional_headline AS "professionalHeadline",
           spoken_languages AS "spokenLanguages",
           primary_industry AS "primaryIndustry",
           functional_domain AS "functionalDomain",
           tags,
           source,
           matching_score AS "matchingScore",
           status,
           created_at AS "createdAt",
           updated_at AS "lastUpdated"
         FROM candidates
         WHERE (archived = false OR archived IS NULL) AND (
           first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR current_title ILIKE $1 OR current_location ILIKE $1
         )
         ORDER BY ${orderBy} ${orderDir}
         LIMIT $2 OFFSET $3`;
      const sqlCamel = `SELECT
           id,
           "firstName" AS "firstName",
           "lastName" AS "lastName",
           email,
           phone,
           "currentTitle" AS "currentTitle",
           "currentLocation" AS "currentLocation",
           summary,
           "experienceYears" AS "experienceYears",
           "technicalSkills" AS "technicalSkills",
           "softSkills" AS "softSkills",
           "programmingLanguages" AS "programmingLanguages",
           frameworks,
           "toolsAndPlatforms" AS "toolsAndPlatforms",
           methodologies,
           "originalCvUrl" AS "originalCvUrl",
           "originalCvFileName" AS "originalCvFileName",
           "originalCvUploadedAt" AS "originalCvUploadedAt",
           "educationLevel" AS "educationLevel",
           universities,
           degrees,
           "graduationYear" AS "graduationYear",
           certifications,
           "expectedSalary" AS "expectedSalary",
           "preferredContractType" AS "preferredContractType",
           freelancer,
           "remotePreference" AS "remotePreference",
           "relocationWillingness" AS "relocationWillingness",
           "availableFrom" AS "availableFrom",
           "seniorityLevel" AS "seniorityLevel",
           "professionalHeadline" AS "professionalHeadline",
           "spokenLanguages" AS "spokenLanguages",
           "primaryIndustry" AS "primaryIndustry",
           "functionalDomain" AS "functionalDomain",
           tags,
           source,
           "matchingScore" AS "matchingScore",
           status,
           "createdAt" AS "createdAt",
           "updatedAt" AS "lastUpdated"
         FROM candidates
         WHERE (archived = false OR archived IS NULL) AND (
           "firstName" ILIKE $1 OR "lastName" ILIKE $1 OR email ILIKE $1 OR "currentTitle" ILIKE $1 OR "currentLocation" ILIKE $1
         )
         ORDER BY ${camelOrderBy} ${orderDir}
         LIMIT $2 OFFSET $3`;
      const rows = await run<any>(sqlSnake, sqlCamel, [like, limit, offset]);
      return rows as CandidateDTO[];
    }

    const sqlSnake = `SELECT
         id,
         first_name AS "firstName",
         last_name AS "lastName",
         email,
         phone,
         current_title AS "currentTitle",
         current_location AS "currentLocation",
         summary,
         experience_years AS "experienceYears",
         technical_skills AS "technicalSkills",
         soft_skills AS "softSkills",
         programming_languages AS "programmingLanguages",
         frameworks,
         tools_and_platforms AS "toolsAndPlatforms",
         methodologies,
         original_cv_url AS "originalCvUrl",
         original_cv_file_name AS "originalCvFileName",
         original_cv_uploaded_at AS "originalCvUploadedAt",
         education_level AS "educationLevel",
         universities,
         degrees,
         graduation_year AS "graduationYear",
         certifications,
         expected_salary AS "expectedSalary",
         preferred_contract_type AS "preferredContractType",
         freelancer,
         remote_preference AS "remotePreference",
         relocation_willingness AS "relocationWillingness",
         available_from AS "availableFrom",
         seniority_level AS "seniorityLevel",
         professional_headline AS "professionalHeadline",
         spoken_languages AS "spokenLanguages",
         primary_industry AS "primaryIndustry",
         functional_domain AS "functionalDomain",
         tags,
         source,
         matching_score AS "matchingScore",
         status,
         created_at AS "createdAt",
         updated_at AS "lastUpdated"
       FROM candidates
       WHERE (archived = false OR archived IS NULL)
       ORDER BY ${orderBy} ${orderDir}
       LIMIT $1 OFFSET $2`;
    const sqlCamel = `SELECT
         id,
         "firstName" AS "firstName",
         "lastName" AS "lastName",
         email,
         phone,
         "currentTitle" AS "currentTitle",
         "currentLocation" AS "currentLocation",
         summary,
         "experienceYears" AS "experienceYears",
         "technicalSkills" AS "technicalSkills",
         "softSkills" AS "softSkills",
         "programmingLanguages" AS "programmingLanguages",
         frameworks,
         "toolsAndPlatforms" AS "toolsAndPlatforms",
         methodologies,
         "originalCvUrl" AS "originalCvUrl",
         "originalCvFileName" AS "originalCvFileName",
         "originalCvUploadedAt" AS "originalCvUploadedAt",
         "educationLevel" AS "educationLevel",
         universities,
         degrees,
         "graduationYear" AS "graduationYear",
         certifications,
         "expectedSalary" AS "expectedSalary",
         "preferredContractType" AS "preferredContractType",
         freelancer,
         "remotePreference" AS "remotePreference",
         "relocationWillingness" AS "relocationWillingness",
         "availableFrom" AS "availableFrom",
         "seniorityLevel" AS "seniorityLevel",
         "professionalHeadline" AS "professionalHeadline",
         "spokenLanguages" AS "spokenLanguages",
         "primaryIndustry" AS "primaryIndustry",
         "functionalDomain" AS "functionalDomain",
         tags,
         source,
         "matchingScore" AS "matchingScore",
         status,
         "createdAt" AS "createdAt",
         "updatedAt" AS "lastUpdated"
       FROM candidates
       WHERE (archived = false OR archived IS NULL)
       ORDER BY ${camelOrderBy} ${orderDir}
       LIMIT $1 OFFSET $2`;
    const rows = await run<any>(sqlSnake, sqlCamel, [limit, offset]);
    return rows as CandidateDTO[];
  },
};


