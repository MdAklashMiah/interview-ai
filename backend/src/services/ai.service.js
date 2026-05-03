const { GoogleGenAI } = require("@google/genai")
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
})


async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const jsonSchema = {
        type: "object",
        properties: {
            candidateName: { type: "string", description: "The actual full name of the candidate extracted from the resume text" },
            matchScore: { type: "number", description: "Score 0-100 indicating resume-to-job match" },
            technicalQuestions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: { type: "string" },
                        intention: { type: "string" },
                        answer: { type: "string" }
                    },
                    required: ["question", "intention", "answer"]
                }
            },
            behavioralQuestions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question: { type: "string" },
                        intention: { type: "string" },
                        answer: { type: "string" }
                    },
                    required: ["question", "intention", "answer"]
                }
            },
            skillGaps: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        skill: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] }
                    },
                    required: ["skill", "severity"]
                }
            },
            preparationPlan: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        day: { type: "number" },
                        focus: { type: "string" },
                        tasks: { type: "array", items: { type: "string" } }
                    },
                    required: ["day", "focus", "tasks"]
                }
            },
            title: { type: "string", description: "Format: [Job Role] Interview Strategy - [Candidate Name]" }
        },
        required: ["candidateName", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "title"]
    };

    const prompt = `You are a career coach and technical interviewer. Generate a JSON interview report based on the candidate's details and job description.
    
    CRITICAL INSTRUCTIONS:
    1. Output MUST be valid JSON matching the schema.
    2. 'candidateName' MUST be the actual person whose resume this is — look at the very top of the resume text. DO NOT use names from References or Projects sections.
    3. 'matchScore' MUST be a plain NUMBER (0-100), no percent sign.
    4. 'title' MUST be formatted as: "[Role Name] Interview Strategy - [Candidate Name]"
    5. Generate specific, high-quality questions relevant to the actual job and candidate skills.
    
    CANDIDATE DATA:
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonSchema,
        }
    })

    let cleanText = response.text.trim()
    if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "")
    }

    console.log("=== AI Interview Report Raw Response (first 500 chars) ===")
    console.log(cleanText.substring(0, 500))

    const data = JSON.parse(cleanText)
    
    return {
        ...data,
        matchScore: parseInt(data.matchScore) || 0,
        technicalQuestions: Array.isArray(data.technicalQuestions) ? data.technicalQuestions : [],
        behavioralQuestions: Array.isArray(data.behavioralQuestions) ? data.behavioralQuestions : [],
        skillGaps: Array.isArray(data.skillGaps) ? data.skillGaps : [],
        preparationPlan: Array.isArray(data.preparationPlan) ? data.preparationPlan : []
    }
}


let browserInstance = null;

async function getBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
        try {
            browserInstance = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            });
        } catch (error) {
            console.error("Failed to launch Puppeteer via Chromium, falling back to local:", error);
            // Fallback for local development if @sparticuz fails
            // Requires regular puppeteer to be installed locally if developing outside Vercel
            const localPuppeteer = require('puppeteer');
            browserInstance = await localPuppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
    }
    return browserInstance;
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await page.setContent(htmlContent, { 
            waitUntil: "networkidle0",
            timeout: 60000 
        });

        const pdfBuffer = await page.pdf({
            format: "A4", 
            printBackground: true,
            margin: {
                top: "15mm",
                bottom: "15mm",
                left: "15mm",
                right: "15mm"
            }
        });
        return pdfBuffer;
    } catch (error) {
        console.error("Puppeteer PDF Error:", error);
        throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
        await page.close();
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    if (browserInstance) {
        await browserInstance.close();
        process.exit();
    }
});


/**
 * Resume JSON Schema — written manually because zod-to-json-schema is 
 * incompatible with Zod v4 and silently returns an empty schema {}.
 * That was the ROOT CAUSE of the "fake/static resume" bug.
 */
const resumeJsonSchema = {
    type: "object",
    properties: {
        header: {
            type: "object",
            properties: {
                name: { type: "string", description: "Candidate's real full name from the resume" },
                title: { type: "string", description: "Professional title based on their experience" },
                email: { type: "string", description: "Email address from the resume" },
                phone: { type: "string", description: "Phone number from the resume" },
                location: { type: "string", description: "City / Country from the resume" },
                linkedin: { type: "string", description: "LinkedIn URL if present" },
                github: { type: "string", description: "GitHub URL if present" }
            },
            required: ["name", "title", "email", "phone", "location"]
        },
        summary: { type: "string", description: "Professional summary tailored to the job description, using the candidate's real experience" },
        experience: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    company: { type: "string" },
                    role: { type: "string" },
                    period: { type: "string", description: "e.g. Jan 2020 - Present" },
                    description: { type: "string", description: "Bullet-point achievements extracted from the actual resume" }
                },
                required: ["company", "role", "period", "description"]
            }
        },
        education: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    school: { type: "string" },
                    degree: { type: "string" },
                    period: { type: "string" },
                    description: { type: "string" }
                },
                required: ["school", "degree", "period"]
            }
        },
        skills: {
            type: "array",
            items: { type: "string" },
            description: "Technical and soft skills from the resume, prioritizing those matching the job description"
        },
        projects: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    link: { type: "string" },
                    description: { type: "string" }
                },
                required: ["name", "description"]
            }
        },
        references: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    contact: { type: "string" }
                },
                required: ["name", "contact"]
            }
        }
    },
    required: ["header", "summary", "experience", "education", "skills"]
};


async function generateResumeHtml({ resume, selfDescription, jobDescription }) {

    console.log("=== generateResumeHtml called ===");
    console.log("Resume text length:", (resume || "").length);
    console.log("Resume text preview:", (resume || "").substring(0, 200));
    console.log("Self desc length:", (selfDescription || "").length);
    console.log("JD length:", (jobDescription || "").length);

    const prompt = `You are a Senior ATS Resume Strategist. Your ONLY job is to extract the REAL data from the candidate's ACTUAL resume and restructure it to match a target job description.

YOU MUST FOLLOW THESE RULES:
1. EVERY field must come from the SOURCE RESUME TEXT below. Do NOT invent data.
2. The "header.name" must be the candidate's REAL name from the resume.
3. The "header.email" must be the REAL email from the resume.
4. The "header.phone" must be the REAL phone from the resume.
5. The "experience" array must contain REAL jobs from the resume with REAL company names and roles.
6. The "skills" array must contain REAL skills mentioned in the resume.
7. The "summary" should be rewritten to target the job description but use ONLY facts from the resume.
8. DO NOT generate fake companies, fake names, fake skills, or placeholder text.
9. If a field is not found in the resume, use an empty string "" — do NOT make up data.

=== SOURCE RESUME TEXT (extract all data from here) ===
${resume || "[No resume text provided]"}
=== END SOURCE RESUME ===

=== TARGET JOB DESCRIPTION (use keywords from here to tailor the resume) ===
${jobDescription || "[No job description provided]"}
=== END JOB DESCRIPTION ===

=== CANDIDATE'S SELF DESCRIPTION (use as supplementary context) ===
${selfDescription || "[Not provided]"}
=== END SELF DESCRIPTION ===

Generate a JSON object matching the provided schema using ONLY real data from the source resume above.`

    const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: resumeJsonSchema,
        }
    });

    console.log("=== AI Resume Response (first 500 chars) ===");
    console.log(response.text.substring(0, 500));

    // --- Safe Data Parsing ---
    let cleanResponse = response.text.trim();
    if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    let rawData;
    try {
        rawData = JSON.parse(cleanResponse);
    } catch (e) {
        console.error("AI Resume Parsing Error:", e);
        console.error("Raw response was:", cleanResponse.substring(0, 1000));
        throw new Error("AI returned malformed data. Please try again.");
    }

    // Normalize with safe defaults
    const data = {
        header: {
            name: rawData.header?.name || "Candidate",
            title: rawData.header?.title || "",
            email: rawData.header?.email || "",
            phone: rawData.header?.phone || "",
            location: rawData.header?.location || "",
            linkedin: rawData.header?.linkedin || "",
            github: rawData.header?.github || ""
        },
        summary: rawData.summary || "",
        experience: Array.isArray(rawData.experience) ? rawData.experience : [],
        education: Array.isArray(rawData.education) ? rawData.education : [],
        skills: Array.isArray(rawData.skills) ? rawData.skills : [],
        projects: Array.isArray(rawData.projects) ? rawData.projects : [],
        references: Array.isArray(rawData.references) ? rawData.references : []
    };

    console.log("=== Parsed Resume Data ===");
    console.log("Name:", data.header.name);
    console.log("Title:", data.header.title);
    console.log("Skills count:", data.skills.length);
    console.log("Experience count:", data.experience.length);

    // Build ATS-friendly HTML
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            :root {
                --primary: #1e293b;
                --accent: #2563eb;
                --text-dark: #1e293b;
                --text-light: #64748b;
                --border: #e2e8f0;
            }

            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Inter', -apple-system, sans-serif; 
                color: var(--text-dark); 
                line-height: 1.4;
                background: white;
            }
            .container { padding: 40px; max-width: 850px; margin: auto; }
            
            header { border-bottom: 2px solid var(--accent); padding-bottom: 15px; margin-bottom: 20px; }
            .name { font-size: 28px; font-weight: 700; color: var(--text-dark); text-transform: uppercase; letter-spacing: -0.01em; }
            .title { font-size: 16px; color: var(--accent); font-weight: 600; margin-top: 2px; }
            .contact { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; font-size: 12px; color: var(--text-light); }
            .contact span { display: flex; align-items: center; }
            
            section { margin-bottom: 20px; }
            .section-title { 
                font-size: 13px; 
                font-weight: 800; 
                color: var(--primary); 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
                margin-bottom: 10px;
                border-bottom: 1px solid var(--border);
                padding-bottom: 3px;
            }
            
            .summary { font-size: 13px; color: var(--text-dark); text-align: justify; }
            
            .entry { margin-bottom: 12px; }
            .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
            .entry-title { font-size: 14px; font-weight: 700; }
            .entry-period { font-size: 12px; color: var(--text-light); font-weight: 500; }
            .entry-subtitle { font-size: 13px; color: var(--accent); font-weight: 600; margin-bottom: 4px; }
            .entry-desc { font-size: 12px; color: var(--text-dark); padding-left: 15px; }
            .entry-desc li { margin-bottom: 2px; list-style-type: disc; }
            
            .skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
            .skill-tag { 
                background: #f8fafc; 
                border: 1px solid var(--border);
                padding: 3px 8px; 
                border-radius: 4px; 
                font-size: 11px; 
                font-weight: 600;
                color: var(--text-dark);
            }
            
            .project-item { border-left: 3px solid var(--border); padding-left: 12px; margin-bottom: 10px; }
            .project-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
            .project-desc { font-size: 12px; color: var(--text-light); }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1 class="name">${data.header.name}</h1>
                ${data.header.title ? `<p class="title">${data.header.title}</p>` : ''}
                <div class="contact">
                    ${data.header.email ? `<span>${data.header.email}</span>` : ''}
                    ${data.header.phone ? `<span>${data.header.phone}</span>` : ''}
                    ${data.header.location ? `<span>${data.header.location}</span>` : ''}
                    ${data.header.linkedin ? `<span>${data.header.linkedin}</span>` : ''}
                    ${data.header.github ? `<span>${data.header.github}</span>` : ''}
                </div>
            </header>

            ${data.summary ? `
            <section>
                <h2 class="section-title">Professional Summary</h2>
                <p class="summary">${data.summary}</p>
            </section>
            ` : ''}

            ${data.experience.length > 0 ? `
            <section>
                <h2 class="section-title">Professional Experience</h2>
                ${data.experience.map(exp => `
                    <div class="entry">
                        <div class="entry-header">
                            <span class="entry-title">${exp?.role || ''}</span>
                            <span class="entry-period">${exp?.period || ''}</span>
                        </div>
                        <p class="entry-subtitle">${exp?.company || ''}</p>
                        <ul class="entry-desc">
                            ${(exp?.description || '').split('\n').map(bullet => {
                                const clean = bullet.trim().replace(/^[-•*]\s*/, '');
                                return clean ? `<li>${clean}</li>` : '';
                            }).join('')}
                        </ul>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.skills.length > 0 ? `
            <section>
                <h2 class="section-title">Technical Skills</h2>
                <div class="skills-list">
                    ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </section>
            ` : ''}

            ${data.projects.length > 0 ? `
            <section>
                <h2 class="section-title">Key Projects</h2>
                ${data.projects.map(proj => `
                    <div class="project-item">
                        <div class="project-name">${proj?.name || ''}</div>
                        <p class="project-desc">${proj?.description || ''}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.education.length > 0 ? `
            <section>
                <h2 class="section-title">Education</h2>
                ${data.education.map(edu => `
                    <div class="entry">
                        <div class="entry-header">
                            <span class="entry-title">${edu?.degree || ''}</span>
                            <span class="entry-period">${edu?.period || ''}</span>
                        </div>
                        <p class="entry-subtitle">${edu?.school || ''}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.references.length > 0 ? `
            <section>
                <h2 class="section-title">References</h2>
                <p class="summary">Available upon request</p>
            </section>
            ` : ''}
        </div>
    </body>
    </html>
    `;
}


async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const htmlContent = await generateResumeHtml({ resume, selfDescription, jobDescription })
    const pdfBuffer = await generatePdfFromHtml(htmlContent)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf, generateResumeHtml }