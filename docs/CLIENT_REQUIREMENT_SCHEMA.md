# Form Schema Specification: Client Requirement Ingestion

**Document Path:** `docs/CLIENT_REQUIREMENT_SCHEMA.md`  
**Author:** AI Solution Architect, THEXRA  
**Target Engine:** Gemini Multimodal Scoping Engine & n8n Automation Engine  
**Version:** 1.0.0  

---

## 1. Form Schema Overview

The primary objective of the THEXRA Client Requirement Ingestion Form is to capture a hybrid payload of structured parametric inputs and unstructured operational narratives from prospective enterprise clients. 

Enterprise Extended Reality (AR/VR/MR), AI, and Digital Twin solutions require tight coupling between hardware capabilities, real-time render engines, spatial constraints, and existing IT enterprise architecture. Unstructured text alone often leads to ambiguous technical scoping, while purely structured forms lack the context necessary to evaluate complex business logic.

This schema balances both:
* **Structured Data:** Constrains downstream variables (budget, target deployment scale, hardware preferences, compliance standards) to allow automated rules execution and precise cost/timeline estimation.
* **Unstructured Data:** Captures qualitative operational friction points, existing workflow descriptions, and business outcomes. This data is injected directly into Gemini’s contextual prompt window to drive cross-domain architectural reasoning (e.g., mapping a specific factory line hazard to a specific spatial physics engine requirement).

---

## 2. Data Field Breakdown

### Company Profile & Stakeholder Context

| Field Name              | Data Type    | Validation Rules             | Reason / Impact on Gemini Scoping Engine                                                                                   |
| :---------------------- | :----------- | :--------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `company_name`          | Text         | Required                     | Identifies the entity and seeds client context for automated PDF proposal templates generated via n8n.                     |
| `industry_vertical`     | Dropdown     | Required                     | Sets the baseline domain context (e.g., Manufacturing, Healthcare, Retail) to constrain Gemini's technical library lookup. |
| `primary_contact_email` | Text         | Required, Valid Email Format | Required by n8n workflow for routing lead alerts and sending finalized proposal documentation.                             |
| `target_audience_role`  | Multi-select | Required                     | Helps Gemini tailor the technical depth of the final output (e.g., C-Suite ROI focus vs. Developer-level API specs).       |

### Operational Context & Business Goals

| Field Name                  | Data Type | Validation Rules                       | Reason / Impact on Gemini Scoping Engine                                                                                            |
| :-------------------------- | :-------- | :------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `primary_use_case`          | Dropdown  | Required                               | Defines the core functional category (e.g., Industrial VR Training, WebAR E-Commerce, Digital Twin Monitoring).                     |
| `operational_pain_points`   | Text      | Required, Min 50 chars, Max 2000 chars | Provides the primary unstructured narrative for Gemini to identify domain friction, root causes, and safety/efficiency bottlenecks. |
| `desired_business_outcomes` | Text      | Required, Min 30 chars, Max 1000 chars | Enables Gemini to compute target KPIs, ROI models, and expected metrics (e.g., % reduction in downtime, throughput boost).          |
| `target_user_count`         | Number    | Required, Min: 1, Max: 100000          | Informs concurrency calculations, cloud rendering scaling, and software seat licensing models.                                      |

### Logistics, Hardware & Constraints

| Field Name                   | Data Type    | Validation Rules | Reason / Impact on Gemini Scoping Engine                                                                                 |
| :--------------------------- | :----------- | :--------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `preferred_target_platforms` | Multi-select | Required         | Constrains engine selection (Unreal Engine vs. Unity vs. WebXR) and build target pipeline (Android ARM vs. Windows x86). |
| `target_hardware`            | Multi-select | Optional         | Informs device profile constraints (e.g., Meta Quest 3 standalone vs. PC-tethered VR vs. Apple Vision Pro).              |
| `budget_range_usd`           | Dropdown     | Required         | Filters architecture viability (e.g., custom high-fidelity Digital Twin vs. turnkey WebAR viewer).                       |
| `target_deployment_timeline` | Dropdown     | Required         | Dictates project phasing strategies (MVP vs. Full Release) and team allocation models generated in the proposal.         |

### Technical Architecture & Edge Cases

| Field Name                     | Data Type    | Validation Rules         | Reason / Impact on Gemini Scoping Engine                                                                                                       |
| :----------------------------- | :----------- | :----------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| `existing_systems_integration` | Multi-select | Optional                 | Triggers Gemini to add middleware, API connectors, and backend data pipeline scoping (e.g., SAP, Siemens MindSphere, CAD/BIM).                 |
| `deployment_environment`       | Dropdown     | Required                 | Determines tracking mode requirements (e.g., 6DoF room-scale, marker-based AR, cloud-rendered WebXR).                                          |
| `compliance_security_reqs`     | Multi-select | Optional                 | Informs security architecture inclusions (e.g., HIPAA compliance for medical, SOC2/ISO27001, air-gapped local networks).                       |
| `custom_technical_notes`       | Text         | Optional, Max 1500 chars | Captures edge cases (e.g., extreme shop floor environments, specific gloves/haptics, low-bandwidth constraints) for specialized prompt tuning. |

---

## 3. Sample Payload: Manufacturing VR Safety Training Scenario

The following JSON payload represents a real-world submission from a heavy manufacturing client seeking a zero-risk VR safety and equipment maintenance simulator.

```json
{
  "submission_metadata": {
    "submitted_at": "2026-09-15T10:30:00Z",
    "form_version": "1.0.0",
    "source_channel": "enterprise_web_portal"
  },
  "company_profile": {
    "company_name": "Apex Global Machinery Corp",
    "industry_vertical": "Manufacturing & Heavy Industry",
    "primary_contact_email": "r.chen@apexmachinery.com",
    "target_audience_role": [
      "VP of Operations",
      "Head of EHS (Environmental Health & Safety)"
    ]
  },
  "operational_context": {
    "primary_use_case": "VR Safety & Machinery Training Simulator",
    "operational_pain_points": "We experience high onboarding delays and costly equipment downtime when training junior technicians on our multi-million-dollar automated stamping presses. Last year, operational errors during live-equipment training resulted in $450,000 in unscheduled downtime and two minor safety incidents. Traditional classroom safety videos fail to build muscle memory for high-risk emergency shutdown procedures.",
    "desired_business_outcomes": "Achieve a 40% reduction in onboarding time, eliminate machinery downtime caused by trainee error, and achieve a 100% pass rate on zero-risk hazard identification protocols prior to floor placement.",
    "target_user_count": 450
  },
  "logistics_and_constraints": {
    "preferred_target_platforms": [
      "Standalone VR",
      "PC-Tethered VR"
    ],
    "target_hardware": [
      "Meta Quest 3 Enterprise",
      "HTC Vive Focus 3"
    ],
    "budget_range_usd": "$100,000 - $250,000",
    "target_deployment_timeline": "3 to 6 Months"
  },
  "technical_and_edge_cases": {
    "existing_systems_integration": [
      "LMS (Learning Management System)",
      "CAD Models (Autodesk Inventor / Siemens NX)"
    ],
    "deployment_environment": "On-Premises Workshop / Dedicated Training Room",
    "compliance_security_reqs": [
      "ISO27001",
      "OSHA Compliance Standard Mapping"
    ],
    "custom_technical_notes": "The factory floor has high electromagnetic interference, so inside-out optical tracking is preferred over external base stations. Training modules must support physical haptic glove integration for fine motor skill assessment on small hydraulic valves."
  }
}

