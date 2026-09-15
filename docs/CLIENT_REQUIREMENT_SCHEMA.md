# Form Schema Specification: Client Requirement Ingestion 

* **Document Path:** `docs/CLIENT_REQUIREMENT_SCHEMA.md`
* **Author:** AI Solution Architect, THEXRA
* **Target Engine:** Gemini Multimodal Scoping Engine & n8n Automation Engine
* **Version:** 1.0

---

## 1. Form Schema Overview

The primary objective of the THEXRA Client Requirement Ingestion Form is to capture a hybrid payload of structured parametric inputs and unstructured operational narratives from prospective enterprise clients. 

Enterprise Extended Reality (AR/VR/MR), AI, and Digital Twin solutions require tight coupling between hardware capabilities, real-time render engines, spatial constraints, and existing IT enterprise architecture. Unstructured text alone often leads to ambiguous technical scoping, while purely structured forms lack the context necessary to evaluate complex business logic.

**This schema balances both:**
* **Structured Data:** Constrains downstream variables (budget, target deployment scale, hardware preferences, compliance standards) to allow automated rules execution and precise cost/timeline estimation.
* **Unstructured Data:** Captures qualitative operational friction points, existing workflow descriptions, and business outcomes. This data is injected directly into Gemini’s contextual prompt window to drive cross-domain architectural reasoning (e.g., mapping a specific factory line hazard to a specific spatial physics engine requirement).

---

## 2. Data Field Breakdown

### Company Profile & Stakeholder Context

| Field Name              | Data Type    | Validation Rules | Reason / Impact on Gemini Scoping Engine                                                                               |
| :---------------------- | :----------- | :--------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `company_name`          | Text         | Required         | Identifies the entity and seeds client context for automated PDF proposal templates generated via n8n.                 |
| `industry_vertical`     | Dropdown     | Required         | Sets baseline domain context (e.g., Manufacturing, Healthcare, Retail) to constrain Gemini’s technical library lookup. |
| `primary_contact_email` | Text         | Required         | Required by n8n workflow for routing lead alerts and sending finalized proposal documentation.                         |
| `target_audience_role`  | Multi-select | Required         | Helps Gemini tailor technical depth (e.g., C-Suite ROI focus vs. Developer-level API specs).                           |

### Operational Context & Business Goals

| Field Name                  | Data Type | Validation Rules                    | Reason / Impact on Gemini Scoping Engine                                                                          |
| :-------------------------- | :-------- | :---------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| `primary_use_case`          | Dropdown  | Required                            | Defines core functional categories (e.g., Industrial VR Training, WebAR E-commerce, Digital Twin Monitoring).     |
| `operational_pain_points`   | Text      | Required (50 chars, Max 2000 chars) | Provide primary narrative for Gemini to identify domain friction, root causes, and safety/efficiency bottlenecks. |
| `desired_business_outcomes` | Text      | Required                            | Enables Gemini to compute target KPIs, ROI models, and expected metrics (e.g., % reduction in downtime).          |
| `target_user_count`         | Numbers   | Required (Min: 1, Max: 10000)       | Informs concurrency calculations, cloud rendering scaling, and software seat licensing models.                    |

### Logistics, Hardware & Constraints

| Field Name                   | Data Type    | Validation Rules | Reason / Impact on Gemini Scoping Engine                                                                          |
| :--------------------------- | :----------- | :--------------- | :---------------------------------------------------------------------------------------------------------------- |
| `preferred_target_platforms` | Multi-select | Required         | Constrains engine selection (Unreal Engine vs. Unity vs. WebXR) and build pipeline (Android Arm vs. Windows x86). |
| `target_hardware`            | Multi-select | Optional         | Informs device profile constraints (e.g., Meta Quest 3 standalone vs PC-tethered VR vs. Apple Vision Pro).        |
| `budget_range_usd`           | Dropdown     | Required         | Filters architecture viability (e.g., custom high-fidelity Digital Twin vs. turnkey WebAR viewer).                |
| `target_deployment_timeline` | Dropdown     | Required         | Dictates project phasing strategies (MVP vs. Full Release) and team allocation models generated in the proposal.  |

### Technical Architecture & Edge Cases

| Field Name                    | Data Type    | Validation Rules         | Reason / Impact on Gemini Scoping Engine                                                                                 |
| :---------------------------- | :----------- | :----------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `existing_system_integration` | Multi-select | Optional                 | Triggers Gemini to add middleware, API connectors, and backend data pipelines (e.g., SAP, Siemens MindSphere, CAD/BIM).  |
| `deployment_environment`      | Dropdown     | Required                 | Determines tracking mode requirements (e.g., 6DoF room-scale, marker-based AR, cloud-rendered WebXR).                    |
| `compliance_security_reqs`    | Multi-select | Optional                 | Informs security architecture inclusions (e.g., HIPAA compliance for medical, SOC2/ISO27001, air-gapped local networks). |
| `custom_technical_notes`      | Text         | Optional (Max 1500 char) | Capture edge cases (e.g., extreme shop floor environments, specific haptics, low-bandwidth limits) for prompt tuning.    |

---

## 3. Sample Payload: Manufacturing VR Safety Training Scenario

The following example JSON payload represents the anticipated data structure submitted by the web form and routed to the n8n automation engine:

```json
{
  "company_name": "AeroTech Solutions",
  "primary_contact_email": "tech-lead@aerotech.com",
  "industry_sector": "Aerospace & Defense",
  "target_audience_role": "Assembly Line Engineers",
  "operational_pain_points": "High error rate during complex wire harness assembly due to reliance on 2D paper manuals.",
  "desired_business_outcomes": "Reduce assembly errors by 40% and speed up technician onboarding using hands-free spatial guidance.",
  "target_user_count": 150,
  "budget_range_usd": "$50,000 - $100,000",
  "timeline_expectations": "3-6 months",
  "existing_hardware_software": "Microsoft HoloLens 2, PTC Vuforia Engine, SAP ERP",
  "additional_requirements": "Must comply with SOC2 security standards and operate fully offline on local enterprise networks."
}