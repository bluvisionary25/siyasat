```mermaid
classDiagram
    class User {
        +int id
        +string full_name
        +string email
        +string password_hash
        +string role
        +string status
        +int failed_login_attempts
        +datetime lockout_until
        +datetime created_at
    }

    class Thesis {
        +int id
        +string title
        +string abstract
        +string author
        +int year
        +string keywords
        +string department
        +string file_path
        +int uploaded_by
        +datetime created_at
    }

    class ResearchGap {
        +int id
        +string title
        +string desc
        +int thesis_id
        +string identified_gaps
        +string future_recommendations
    }

    class AuthController {
        +register(req, res)
        +login(req, res)
        +authenticateToken(req, res, next)
    }

    class ThesisController {
        +getTheses(req, res)
        +uploadThesis(req, res)
        +deleteThesis(req, res)
        +downloadThesisPdf(req, res)
        +generatePdf(req, res)
    }

    class SimilarityService {
        +getWordTokens(text) Set
        +calculateJaccardSimilarity(textA, textB) float
        +checkForDuplicateThesis(title, abstract) Object
    }

    class AiGapService {
        +generateAiGaps(params) Array
        +analyzeGaps(req, res)
        +analyzeThesisGap(req, res)
    }

    class AccountsPage {
        +function onNavigate
        +Object currentUser
        +Array usersList
        +function onUpdateRole
        +function onToggleStatus
        -int openRoleDropdownId
        -int openBlockModalId
        -int updatingId
        +handleRoleSelect(user, newRole)
        +handleConfirmBlock(user)
    }

    class RepositoryPage {
        +function onNavigate
        +Object currentUser
        +Array thesesList
        +function onSelectPaper
        +function onDeletePaper
        -string searchQuery
        -string selectedBranch
        -string sortBy
        -int openCardMenuId
        -Object paperToDelete
        -Object selectedPaperForAi
        -boolean isAnalyzing
        -string aiError
        -Array aiGaps
        +handleAnalyzePaperGaps(paper)
        +handleDeleteConfirm()
    }

    User "1" --> "0..*" Thesis : uploads
    Thesis "1" --> "0..*" ResearchGap : analyzed_for
    AuthController ..> User : manages
    ThesisController ..> Thesis : manages
    ThesisController ..> SimilarityService : uses_for_dups
    AiGapService ..> ResearchGap : generates
    AccountsPage ..> User : displays_and_modifies
    RepositoryPage ..> Thesis : lists_and_triggers_actions
    RepositoryPage ..> AiGapService : calls_api
```

### Summary of SIYASAT Class Design
* **Model Schemas & Multiplicity**: Establishes strong relations between the `User` and `Thesis` (1 to 0..*), as well as a `Thesis` and its generated `ResearchGap` (1 to 0..*).
* **Core Controllers & Services**: Employs an `AuthController` for credential validation and token-based middleware, a `ThesisController` delegating to a `SimilarityService` (using token-based Jaccard similarity to prevent duplicate submissions), and an `AiGapService` invoking the Groq Llama API for research gap analysis.
* **Component-Level React State**: Maps detailed UI properties, callback props (`onUpdateRole`, `onToggleStatus`), and local component state (like modals, dropdowns, and search queries) within both the `AccountsPage` and `RepositoryPage` files.
