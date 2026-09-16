/**
 * AWS Orbit Masterclass — application script
 * - Mobile drawer + sticky TOC scroll-spy
 * - Reading progress
 * - Data-driven MCQ renderer with balanced option shuffling
 */

(() => {
  "use strict";

  /* --------------------------------------------------------------------------
   * Quiz bank — Modules 1 & 2 (extend in follow-ups)
   * Each option marked with correct: true|false; renderer shuffles positions.
   * ------------------------------------------------------------------------ */
  const QUIZ_BANK = {
    module1: [
      {
        id: "m1-q01",
        prompt: "In cloud computing, what does “elasticity” primarily describe?",
        options: [
          {
            text: "The ability to grow and shrink capacity to match demand",
            correct: true,
          },
          {
            text: "The physical stretchiness of fiber optic cables between AZs",
            correct: false,
          },
          {
            text: "A billing discount for committing to 3 years of usage",
            correct: false,
          },
          {
            text: "Encrypting data both at rest and in transit by default",
            correct: false,
          },
        ],
        explanation:
          "Elasticity is demand-matching scale: add capacity when traffic spikes, release it when demand falls (manually or via Auto Scaling). CapEx-heavy data centers are typically rigid; cloud APIs make capacity a dial you turn.",
      },
      {
        id: "m1-q02",
        prompt: "Which statement best describes Infrastructure as a Service (IaaS)?",
        options: [
          {
            text: "You rent virtual machines, networking, and storage while managing the OS and apps yourself",
            correct: true,
          },
          {
            text: "The provider fully manages your application code and runtime with zero OS access",
            correct: false,
          },
          {
            text: "You only pay for finished business software like email or CRM",
            correct: false,
          },
          {
            text: "It exclusively means running containers without any virtualization layer",
            correct: false,
          },
        ],
        explanation:
          "IaaS (e.g., EC2 + VPC + EBS) gives you building blocks: compute, network, storage. You still patch the OS, harden configs, and deploy apps. PaaS raises the abstraction; SaaS delivers finished applications.",
      },
      {
        id: "m1-q03",
        prompt: "Under the AWS Shared Responsibility Model, who is responsible for patching the guest operating system on an EC2 instance?",
        options: [
          { text: "The customer (you)", correct: true },
          { text: "AWS exclusively, for all instance types", correct: false },
          { text: "The AZ provider partner only", correct: false },
          { text: "Nobody — EC2 OS images never need patches", correct: false },
        ],
        explanation:
          "AWS secures the cloud (facilities, hardware, hypervisor, managed control planes). On EC2 you own the guest OS, packages, application code, and data. Managed services shift more OS burden to AWS, but identity and data classification remain yours.",
      },
      {
        id: "m1-q04",
        prompt: "What is the safest day-one practice for a brand-new AWS account’s root user?",
        options: [
          {
            text: "Enable MFA, lock away root credentials, and create an IAM admin user (or Identity Center admin) for daily work",
            correct: true,
          },
          {
            text: "Share the root password with the whole team via Slack for convenience",
            correct: false,
          },
          {
            text: "Create access keys for the root user and use them in CI/CD",
            correct: false,
          },
          {
            text: "Disable CloudTrail so logs do not cost money",
            correct: false,
          },
        ],
        explanation:
          "Root is the break-glass identity with unrestricted power. MFA, no root access keys, and day-to-day work via IAM Identity Center or IAM users/roles dramatically reduce blast radius if a laptop or token is compromised.",
      },
      {
        id: "m1-q05",
        prompt: "CapEx vs OpEx in cloud terms — which is most accurate?",
        options: [
          {
            text: "Cloud typically shifts large upfront CapEx (buying servers) into OpEx (paying for usage over time)",
            correct: true,
          },
          {
            text: "Cloud always eliminates every cost category forever",
            correct: false,
          },
          {
            text: "OpEx means you must buy hardware before any workload can run",
            correct: false,
          },
          {
            text: "CapEx and OpEx are identical accounting labels in every country",
            correct: false,
          },
        ],
        explanation:
          "Traditional IT buys racks years ahead (CapEx). Cloud bills resemble utilities (OpEx): pay for what you provision and consume. Finance teams still care about commitments (Savings Plans/RIs), but the economic model flips from “own metal” to “rent capacity.”",
      },
      {
        id: "m1-q06",
        prompt: "Which AWS tool is designed to estimate monthly cost before you deploy?",
        options: [
          { text: "AWS Pricing Calculator", correct: true },
          { text: "Amazon CloudFront", correct: false },
          { text: "AWS Snowball Edge", correct: false },
          { text: "Amazon Polly", correct: false },
        ],
        explanation:
          "The AWS Pricing Calculator lets you model services, regions, and usage assumptions. Cost Explorer and Budgets help after you have spend; the Calculator helps before you launch.",
      },
      {
        id: "m1-q07",
        prompt: "A “Region” in AWS is best described as:",
        options: [
          {
            text: "A geographic area containing multiple isolated Availability Zones",
            correct: true,
          },
          {
            text: "A single physical rack in one data center",
            correct: false,
          },
          {
            text: "Only an edge cache location for CloudFront",
            correct: false,
          },
          {
            text: "A billing currency setting in the console",
            correct: false,
          },
        ],
        explanation:
          "Regions (e.g., us-east-1) are geographic clusters of AZs. You choose a Region for latency, compliance, and service availability. Edge locations are a separate layer optimized for content delivery.",
      },
      {
        id: "m1-q08",
        prompt: "Why create a billing alarm early in an AWS learning account?",
        options: [
          {
            text: "To get notified if spend crosses a threshold you set (e.g., $5 or $10)",
            correct: true,
          },
          {
            text: "Because alarms automatically delete expensive resources",
            correct: false,
          },
          {
            text: "Because AWS refuses to bill you without an alarm",
            correct: false,
          },
          {
            text: "To increase the Free Tier limits permanently",
            correct: false,
          },
        ],
        explanation:
          "Cloud spend can surprise beginners (forgotten instances, public IPv4 charges, NAT gateways). A CloudWatch billing alarm (or Budgets alert) is an early warning system — it notifies; it does not auto-remediate unless you build that.",
      },
      {
        id: "m1-q09",
        prompt: "Which pair correctly maps service models?",
        options: [
          {
            text: "EC2 ≈ IaaS; Elastic Beanstalk ≈ PaaS-like; Amazon WorkMail ≈ SaaS-like",
            correct: true,
          },
          {
            text: "S3 ≈ SaaS only; Lambda ≈ IaaS only; RDS ≈ bare metal",
            correct: false,
          },
          {
            text: "All AWS services are purely SaaS with no infrastructure choices",
            correct: false,
          },
          {
            text: "IAM is IaaS; VPC is SaaS; CloudTrail is PaaS",
            correct: false,
          },
        ],
        explanation:
          "Mental model: IaaS = you manage more of the stack; PaaS = platform abstracts servers; SaaS = consume the app. AWS spans the spectrum — EC2 is classic IaaS; many higher-level services blur lines.",
      },
      {
        id: "m1-q10",
        prompt: "What does an AWS Account ID uniquely identify?",
        options: [
          {
            text: "Your 12-digit AWS account — the hard boundary for resources, billing, and IAM principals",
            correct: true,
          },
          {
            text: "A single EC2 instance hostname",
            correct: false,
          },
          {
            text: "Only your credit card token at the bank",
            correct: false,
          },
          {
            text: "The physical serial number of an AZ router",
            correct: false,
          },
        ],
        explanation:
          "Everything you create lives inside an account. Cross-account access, Organizations, and SCPs all treat the account as the fundamental tenancy and blast-radius unit.",
      },
      {
        id: "m1-q11",
        prompt: "“High availability” is most closely related to:",
        options: [
          {
            text: "Designing so a single failure (host, AZ) does not take down the whole system",
            correct: true,
          },
          {
            text: "Always using the largest EC2 instance size available",
            correct: false,
          },
          {
            text: "Storing passwords in plaintext for faster logins",
            correct: false,
          },
          {
            text: "Deploying exclusively to one Availability Zone for simplicity",
            correct: false,
          },
        ],
        explanation:
          "HA is about surviving failures: multi-AZ databases, load-balanced fleets across AZs, health checks, and graceful degradation. Bigger instances help capacity — not failure isolation.",
      },
      {
        id: "m1-q12",
        prompt: "Which CLI command verifies that your local credentials can call AWS successfully?",
        options: [
          { text: "aws sts get-caller-identity", correct: true },
          { text: "aws reboot universe", correct: false },
          { text: "curl https://aws.amazon.com/ping-root", correct: false },
          { text: "iam --whoami --global", correct: false },
        ],
        explanation:
          "`aws sts get-caller-identity` returns Account, UserId, and Arn for the credentials in use — the standard smoke test after configuring the AWS CLI or SSO profiles.",
      },
    ],

    module2: [
      {
        id: "m2-q01",
        prompt: "How many Availability Zones should a production, highly available architecture typically span (minimum design mindset)?",
        options: [
          {
            text: "At least two AZs (commonly three for many managed services’ defaults)",
            correct: true,
          },
          { text: "Exactly one AZ to minimize network hops", correct: false },
          { text: "Zero AZs — Regions do not use AZs", correct: false },
          { text: "One AZ per IAM user", correct: false },
        ],
        explanation:
          "AZs are isolated failure domains. Running across ≥2 AZs lets you survive an AZ outage. Many AWS services (ALB, RDS Multi-AZ, ECS/EKS patterns) assume multi-AZ thinking.",
      },
      {
        id: "m2-q02",
        prompt: "What is an AWS Local Zone optimized for?",
        options: [
          {
            text: "Ultra-low latency compute/storage closer to large metro end-users than a parent Region",
            correct: true,
          },
          {
            text: "Replacing CloudFront edge locations entirely worldwide",
            correct: false,
          },
          {
            text: "Storing Glacier archives cheaper than any other tier",
            correct: false,
          },
          {
            text: "Running the AWS global control plane exclusively",
            correct: false,
          },
        ],
        explanation:
          "Local Zones extend select services next to dense metros (gaming, media, inference). They attach to a parent Region for the broader service catalog and control plane relationships.",
      },
      {
        id: "m2-q03",
        prompt: "Edge locations / Points of Presence are primarily used by:",
        options: [
          {
            text: "Services like CloudFront and Route 53 that need low-latency delivery and DNS near users",
            correct: true,
          },
          {
            text: "Hosting your primary Multi-AZ RDS writer nodes",
            correct: false,
          },
          {
            text: "Storing EBS volume replicas for EC2",
            correct: false,
          },
          {
            text: "Running customer VPC routers exclusively",
            correct: false,
          },
        ],
        explanation:
          "The edge network caches content and answers DNS close to viewers. WAF can ride along when associated with CloudFront, but systems of record (RDS, EBS) still live in Regions/AZs.",
      },
      {
        id: "m2-q04",
        prompt: "Why is us-east-1 (N. Virginia) often mentioned in AWS learning materials?",
        options: [
          {
            text: "It is the oldest/largest Region and often gets features first — and hosts many global service endpoints",
            correct: true,
          },
          {
            text: "It is the only Region that supports EC2",
            correct: false,
          },
          {
            text: "It has no Availability Zones",
            correct: false,
          },
          {
            text: "It cannot be used for production workloads",
            correct: false,
          },
        ],
        explanation:
          "Many global services and console defaults historically center on us-east-1. That also means noisier neighbor dynamics and occasional blast-radius concentration — choose Regions deliberately for production.",
      },
      {
        id: "m2-q05",
        prompt: "Latency between Availability Zones in the same Region is typically:",
        options: [
          {
            text: "Low single-digit milliseconds — designed for synchronous replication patterns",
            correct: true,
          },
          {
            text: "Hundreds of milliseconds like cross-continent links",
            correct: false,
          },
          {
            text: "Exactly zero because AZs share one motherboard",
            correct: false,
          },
          {
            text: "Undefined — AZs cannot communicate",
            correct: false,
          },
        ],
        explanation:
          "AZs are close enough for sync replication (e.g., Multi-AZ RDS) yet isolated enough (power, networking, flood plains) to fail independently. Cross-Region is higher latency and usually async.",
      },
      {
        id: "m2-q06",
        prompt: "What is AWS Outposts?",
        options: [
          {
            text: "AWS-managed hardware racks that bring select AWS services on-premises, tethered to a Region",
            correct: true,
          },
          {
            text: "A desktop theme for the AWS console",
            correct: false,
          },
          {
            text: "A Free Tier-only Region for students",
            correct: false,
          },
          {
            text: "A replacement for IAM policies",
            correct: false,
          },
        ],
        explanation:
          "Outposts address low-latency or data-residency needs by placing AWS-designed infrastructure in your DC, while control plane / regional services remain linked to a parent Region.",
      },
      {
        id: "m2-q07",
        prompt: "Choosing a Region for a regulated workload should prioritize:",
        options: [
          {
            text: "Data residency/compliance, latency to users, service availability, and cost",
            correct: true,
          },
          {
            text: "Only whichever Region has the coolest code name",
            correct: false,
          },
          {
            text: "Always the Region farthest from users for safety",
            correct: false,
          },
          {
            text: "Random selection each deploy for chaos",
            correct: false,
          },
        ],
        explanation:
          "Compliance (where data may live), UX latency, feature parity (not every service/feature is in every Region), and pricing all matter. Document the decision — auditors will ask.",
      },
      {
        id: "m2-q08",
        prompt: "A Wavelength Zone is designed to place compute/storage:",
        options: [
          {
            text: "Inside telecom 5G networks at the edge of the carrier network",
            correct: true,
          },
          {
            text: "Only inside Glacier Deep Archive vaults",
            correct: false,
          },
          {
            text: "On the customer’s laptop via USB",
            correct: false,
          },
          {
            text: "In a secret fourth AZ invisible to IAM",
            correct: false,
          },
        ],
        explanation:
          "Wavelength targets ultra-low latency mobile use cases (AR/VR, live video, robotics) by embedding AWS infrastructure in 5G provider networks, anchored to a Region.",
      },
      {
        id: "m2-q09",
        prompt: "Cross-Region replication is most often chosen when you need:",
        options: [
          {
            text: "Disaster recovery distance, global user proximity, or jurisdictional copies of data",
            correct: true,
          },
          {
            text: "Lower latency than within a single AZ",
            correct: false,
          },
          {
            text: "To avoid using IAM entirely",
            correct: false,
          },
          {
            text: "To make EC2 instance IDs globally identical",
            correct: false,
          },
        ],
        explanation:
          "AZs already give strong HA inside a Region. Cross-Region adds independence from regional events and can place data near continents of users — at the cost of latency and complexity.",
      },
      {
        id: "m2-q10",
        prompt: "Which statement about AZ names like `us-east-1a` is true?",
        options: [
          {
            text: "AZ letter mapping can differ per AWS account — use AZ IDs for consistent physical mapping across accounts",
            correct: true,
          },
          {
            text: "`us-east-1a` is guaranteed identical hardware in every account worldwide",
            correct: false,
          },
          {
            text: "AZ names are only cosmetic and unused by APIs",
            correct: false,
          },
          {
            text: "All accounts share one physical AZ labeled `a`",
            correct: false,
          },
        ],
        explanation:
          "AWS randomizes AZ-to-letter mapping per account to balance load. AZ IDs (e.g., `use1-az2`) identify the same physical AZ across accounts — critical for multi-account networking.",
      },
      {
        id: "m2-q11",
        prompt: "Global services (conceptual examples: IAM, Route 53, CloudFront) differ from Regional services because they:",
        options: [
          {
            text: "Are not confined to a single Region’s data plane in the same way — control/config is globally scoped",
            correct: true,
          },
          {
            text: "Can only be used inside Local Zones",
            correct: false,
          },
          {
            text: "Never generate CloudTrail events",
            correct: false,
          },
          {
            text: "Require a dedicated physical Region called `aws-global-1`",
            correct: false,
          },
        ],
        explanation:
          "IAM users/policies are global; you do not create a new IAM directory per Region. Many data services (EC2, VPC, RDS) are Region-scoped. Always check docs for scope — it affects DR and IaC design.",
      },
      {
        id: "m2-q12",
        prompt: "For a multi-AZ VPC design, public subnets are typically where you place:",
        options: [
          {
            text: "Load balancers and NAT gateways that need Internet Gateway paths",
            correct: true,
          },
          {
            text: "All databases with no security groups",
            correct: false,
          },
          {
            text: "Only Glacier vaults",
            correct: false,
          },
          {
            text: "The AWS root user home directory",
            correct: false,
          },
        ],
        explanation:
          "Public subnets have routes to an Internet Gateway. Best practice: put ALBs/NLBs (and often NAT GWs) there; keep app/data tiers in private subnets with controlled egress. (Full VPC deep-dive arrives in a later module.)",
      },
      {
        id: "m2-q13",
        prompt: "Fault isolation — which boundary is strongest against a full regional service event?",
        options: [
          {
            text: "A secondary Region (cross-Region DR) rather than only a second AZ",
            correct: true,
          },
          {
            text: "Two security groups in the same subnet",
            correct: false,
          },
          {
            text: "Two IAM access keys on one user",
            correct: false,
          },
          {
            text: "Two tags on the same EC2 instance",
            correct: false,
          },
        ],
        explanation:
          "Multi-AZ protects against AZ-level failure. Regional control-plane or widespread regional issues need cross-Region strategies (backup restore, pilot light, warm standby, active-active).",
      },
      {
        id: "m2-q14",
        prompt: "Amazon CloudFront improves user-perceived performance mainly by:",
        options: [
          {
            text: "Caching and terminating TLS at edge locations close to viewers",
            correct: true,
          },
          {
            text: "Moving your entire VPC into the viewer’s browser",
            correct: false,
          },
          {
            text: "Deleting unused Availability Zones automatically",
            correct: false,
          },
          {
            text: "Converting all databases to SQLite on the CDN node",
            correct: false,
          },
        ],
        explanation:
          "CDN edge caches static (and configurable dynamic) content near users, cutting round trips to origin Regions. Origins remain in S3/ALB/custom origins you control.",
      },
    ],

    module3: [
      {
        id: "m3-q01",
        prompt: "What is the strongest reason to avoid daily use of the AWS account root user?",
        options: [
          {
            text: "Root has unrestricted power; a compromise or mistake has maximum blast radius",
            correct: true,
          },
          {
            text: "Root cannot enable MFA",
            correct: false,
          },
          {
            text: "Root is billed at a higher EC2 rate",
            correct: false,
          },
          {
            text: "Root only works in us-east-1",
            correct: false,
          },
        ],
        explanation:
          "Root bypasses IAM least privilege. Use Identity Center/IAM admins for daily work; keep root MFA’d and locked away for break-glass.",
      },
      {
        id: "m3-q02",
        prompt: "In IAM policy evaluation, what happens if an applicable statement has Effect Deny?",
        options: [
          {
            text: "The request is denied — explicit Deny overrides Allows",
            correct: true,
          },
          {
            text: "Deny is ignored if any Allow exists",
            correct: false,
          },
          {
            text: "AWS prompts the user to confirm",
            correct: false,
          },
          {
            text: "Only SCPs can deny; IAM Deny is advisory",
            correct: false,
          },
        ],
        explanation:
          "Evaluation starts implicit deny; Allows open access; any matching explicit Deny wins. This is foundational for guardrails.",
      },
      {
        id: "m3-q03",
        prompt: "What does a role’s trust policy control?",
        options: [
          {
            text: "Which principals are allowed to call sts:AssumeRole on that role",
            correct: true,
          },
          {
            text: "Which S3 buckets the role can delete",
            correct: false,
          },
          {
            text: "The Region where the role must be created",
            correct: false,
          },
          {
            text: "Whether CloudTrail is enabled",
            correct: false,
          },
        ],
        explanation:
          "Trust policy = who can assume. Permissions policy = what the assumed session can do. Both must allow the intended path.",
      },
      {
        id: "m3-q04",
        prompt: "IAM Identity Center is primarily designed for:",
        options: [
          {
            text: "Workforce single sign-on into AWS accounts via permission sets",
            correct: true,
          },
          {
            text: "Replacing security groups inside a VPC",
            correct: false,
          },
          {
            text: "Encrypting EBS volumes automatically",
            correct: false,
          },
          {
            text: "Routing CloudFront cache behaviors",
            correct: false,
          },
        ],
        explanation:
          "Identity Center federates humans (often from an external IdP) and assigns permission sets across accounts — preferred over long-lived IAM users.",
      },
      {
        id: "m3-q05",
        prompt: "Service Control Policies (SCPs) in AWS Organizations:",
        options: [
          {
            text: "Set maximum permissions (ceilings) for accounts; they do not grant access by themselves",
            correct: true,
          },
          {
            text: "Replace all IAM policies inside member accounts",
            correct: false,
          },
          {
            text: "Only apply to the management account root user",
            correct: false,
          },
          {
            text: "Are required to launch EC2 instances",
            correct: false,
          },
        ],
        explanation:
          "SCPs are guardrails (ceilings), not grants. A request still needs an Allow from identity/resource policies; an applicable SCP Deny (or missing Allow in an allow-list SCP strategy) blocks it. SCPs typically apply to member accounts, not as a substitute for IAM.",
      },
      {
        id: "m3-q06",
        prompt: "A permission boundary is best described as:",
        options: [
          {
            text: "The maximum permissions a user or role can ever be granted",
            correct: true,
          },
          {
            text: "A Network ACL rule set",
            correct: false,
          },
          {
            text: "An S3 bucket’s CORS configuration",
            correct: false,
          },
          {
            text: "The edge location nearest the caller",
            correct: false,
          },
        ],
        explanation:
          "Boundaries let you safely delegate IAM administration: admins can create roles, but cannot exceed the boundary.",
      },
      {
        id: "m3-q07",
        prompt: "Which credential pattern is preferred for applications on EC2?",
        options: [
          {
            text: "IAM instance profile (role) delivering temporary credentials via the metadata service",
            correct: true,
          },
          {
            text: "Hard-coding root access keys in user data",
            correct: false,
          },
          {
            text: "Sharing one IAM user’s access key across the fleet in a public gist",
            correct: false,
          },
          {
            text: "Disabling IAM and using only security groups",
            correct: false,
          },
        ],
        explanation:
          "Instance profiles rotate temporary creds automatically and avoid long-lived keys on disk. Pair with IMDSv2.",
      },
      {
        id: "m3-q08",
        prompt: "Resource-based policies differ from identity-based policies because they:",
        options: [
          {
            text: "Are attached to resources (e.g., S3 buckets) and can grant cross-account principal access",
            correct: true,
          },
          {
            text: "Can only Deny, never Allow",
            correct: false,
          },
          {
            text: "Are evaluated only in Local Zones",
            correct: false,
          },
          {
            text: "Replace the need for HTTPS",
            correct: false,
          },
        ],
        explanation:
          "Bucket policies, KMS key policies, and queue policies live on the resource. Cross-account access often needs both sides configured.",
      },
      {
        id: "m3-q09",
        prompt: "What does sts:AssumeRole return that long-term access keys do not?",
        options: [
          {
            text: "Temporary security credentials with an expiration",
            correct: true,
          },
          {
            text: "A permanent root password reset token",
            correct: false,
          },
          {
            text: "A new AWS Account ID",
            correct: false,
          },
          {
            text: "An Elastic IP address",
            correct: false,
          },
        ],
        explanation:
          "STS sessions expire (configurable duration). That time-boxing shrinks risk if credentials leak.",
      },
      {
        id: "m3-q10",
        prompt: "aws:SecureTransport = false in a Deny condition on an S3 bucket policy typically enforces:",
        options: [
          {
            text: "Clients must use HTTPS/TLS to access the bucket",
            correct: true,
          },
          {
            text: "Only IMDSv1 is allowed",
            correct: false,
          },
          {
            text: "Objects must use Glacier Deep Archive",
            correct: false,
          },
          {
            text: "The bucket must be public",
            correct: false,
          },
        ],
        explanation:
          "Denying requests where SecureTransport is false blocks plaintext HTTP access to the bucket.",
      },
      {
        id: "m3-q11",
        prompt: "Which statement about IAM groups is correct?",
        options: [
          {
            text: "Groups are a way to attach policies to many users; groups themselves do not sign API requests",
            correct: true,
          },
          {
            text: "Groups can be assumed via STS like roles",
            correct: false,
          },
          {
            text: "Groups replace SCPs in Organizations",
            correct: false,
          },
          {
            text: "Each group maps 1:1 to an Availability Zone",
            correct: false,
          },
        ],
        explanation:
          "Only principals with credentials (users/roles/federated sessions) call APIs. Groups are permission packaging for users.",
      },
      {
        id: "m3-q12",
        prompt: "Cross-account role access for a third-party vendor should commonly include:",
        options: [
          {
            text: "A trust policy condition such as ExternalId (and least-privilege permissions)",
            correct: true,
          },
          {
            text: "Publishing the vendor’s IAM access keys in your README",
            correct: false,
          },
          {
            text: "Making the S3 bucket ACL public-read",
            correct: false,
          },
          {
            text: "Disabling CloudTrail in both accounts",
            correct: false,
          },
        ],
        explanation:
          "ExternalId mitigates the confused deputy problem when third parties assume roles into many customer accounts.",
      },
    ],

    module4: [
      {
        id: "m4-q01",
        prompt: "An Amazon Machine Image (AMI) primarily provides:",
        options: [
          {
            text: "A launchable template of root volume contents plus launch metadata",
            correct: true,
          },
          {
            text: "A CloudFront distribution ID",
            correct: false,
          },
          {
            text: "A Route 53 hosted zone",
            correct: false,
          },
          {
            text: "An Organizations SCP document",
            correct: false,
          },
        ],
        explanation:
          "AMIs package the boot disk (and mapping) so you can launch consistent instances. Golden AMIs bake config ahead of time.",
      },
      {
        id: "m4-q02",
        prompt: "What happens to instance store volumes when you stop an EC2 instance?",
        options: [
          {
            text: "Data on instance store is lost; it is ephemeral",
            correct: true,
          },
          {
            text: "Instance store is snapshotted to Glacier automatically",
            correct: false,
          },
          {
            text: "Instance store becomes an EFS filesystem",
            correct: false,
          },
          {
            text: "Nothing — instance store survives stop/start forever",
            correct: false,
          },
        ],
        explanation:
          "Instance store is physically attached ephemeral storage. Use EBS for durable disks; use instance store for scratch/cache.",
      },
      {
        id: "m4-q03",
        prompt: "IMDSv2 improves security of the instance metadata service by:",
        options: [
          {
            text: "Requiring a session token (PUT) before metadata/credential retrieval",
            correct: true,
          },
          {
            text: "Disabling all IAM roles on EC2",
            correct: false,
          },
          {
            text: "Encrypting EBS with a public key posted to S3",
            correct: false,
          },
          {
            text: "Forcing all instances into a cluster placement group",
            correct: false,
          },
        ],
        explanation:
          "The hop-limited token exchange makes SSRF-style credential theft much harder than open IMDSv1 GETs.",
      },
      {
        id: "m4-q04",
        prompt: "Which EC2 purchase option can reclaim capacity with a two-minute interruption notice?",
        options: [
          { text: "Spot Instances", correct: true },
          { text: "Dedicated Hosts only", correct: false },
          { text: "Savings Plans exclusively", correct: false },
          { text: "On-Demand with Elastic IP", correct: false },
        ],
        explanation:
          "Spot uses spare capacity at a discount but can be interrupted. Architect for stateless/restartable workloads.",
      },
      {
        id: "m4-q05",
        prompt: "An Auto Scaling group’s main job is to:",
        options: [
          {
            text: "Maintain desired capacity across AZs and replace unhealthy instances",
            correct: true,
          },
          {
            text: "Replace IAM policies hourly",
            correct: false,
          },
          {
            text: "Create new AWS Regions",
            correct: false,
          },
          {
            text: "Terminate the VPC when CPU is idle",
            correct: false,
          },
        ],
        explanation:
          "ASGs use launch templates + health checks/metrics to scale out/in and self-heal fleets.",
      },
      {
        id: "m4-q06",
        prompt: "A cluster placement group is optimized for:",
        options: [
          {
            text: "Low-latency, high-throughput networking between instances in one AZ",
            correct: true,
          },
          {
            text: "Spreading instances across as many Regions as possible",
            correct: false,
          },
          {
            text: "Guaranteeing Spot prices under $0.01",
            correct: false,
          },
          {
            text: "Disabling hypervisors for all tenants",
            correct: false,
          },
        ],
        explanation:
          "Cluster placement packs instances for HPC-style east-west performance — with correlated failure tradeoffs.",
      },
      {
        id: "m4-q07",
        prompt: "User data on EC2 is typically used to:",
        options: [
          {
            text: "Run bootstrap scripts via cloud-init on first launch",
            correct: true,
          },
          {
            text: "Store the account root password permanently",
            correct: false,
          },
          {
            text: "Replace VPC route tables",
            correct: false,
          },
          {
            text: "Bill transfer acceleration fees",
            correct: false,
          },
        ],
        explanation:
          "User data bootstraps packages/agents. Prefer baking AMIs for production repeatability; keep secrets out of user data.",
      },
      {
        id: "m4-q08",
        prompt: "Which statement about stopping vs terminating an EBS-backed instance is true?",
        options: [
          {
            text: "Stop keeps the instance ID and attached EBS volumes; terminate deletes the instance and deletes the root volume unless DeleteOnTermination is false",
            correct: true,
          },
          {
            text: "Stop and terminate are identical API calls",
            correct: false,
          },
          {
            text: "Terminate always keeps instance store data",
            correct: false,
          },
          {
            text: "Stop deletes all Elastic IPs account-wide",
            correct: false,
          },
        ],
        explanation:
          "Stop/start is temporary shutdown (EBS data persists; instance store does not). Terminate destroys the instance; root EBS deletion follows the DeleteOnTermination flag (true by default for many root volumes).",
      },
      {
        id: "m4-q09",
        prompt: "Graviton instance types (for example m7g or c7g — not GPU families like g5) are based on:",
        options: [
          {
            text: "AWS-designed Arm processors — often strong price/performance",
            correct: true,
          },
          {
            text: "NVIDIA GPU accelerators (those are families like g4dn/g5)",
            correct: false,
          },
          {
            text: "IBM mainframes in Local Zones",
            correct: false,
          },
          {
            text: "Client-side WASM runtimes",
            correct: false,
          },
        ],
        explanation:
          "Graviton = Arm CPUs, named with a generation + g suffix (m7g, c7g, r7g). Do not confuse with GPU instance families whose names start with g (g4dn, g5). Validate Arm support before switching fleets.",
      },
      {
        id: "m4-q10",
        prompt: "Why attach an IAM instance profile to EC2 instead of embedding access keys?",
        options: [
          {
            text: "The role provides rotating temporary credentials without shipping long-lived secrets",
            correct: true,
          },
          {
            text: "Instance profiles disable CloudWatch billing",
            correct: false,
          },
          {
            text: "Keys in user data are encrypted by the IGW automatically",
            correct: false,
          },
          {
            text: "IAM roles only work with Spot",
            correct: false,
          },
        ],
        explanation:
          "Metadata service delivers STS credentials for the role. No static keys to rotate by hand or leak in AMIs.",
      },
      {
        id: "m4-q11",
        prompt: "Burstable T-family instances use CPU credits to:",
        options: [
          {
            text: "Allow baseline performance with ability to burst when credits remain",
            correct: true,
          },
          {
            text: "Pay for Direct Connect ports",
            correct: false,
          },
          {
            text: "Increase S3 durability from 11 to 12 nines",
            correct: false,
          },
          {
            text: "Bypass security groups",
            correct: false,
          },
        ],
        explanation:
          "T instances accumulate credits at rest and spend them under load. Sustained high CPU may need unlimited mode or a non-burstable family.",
      },
      {
        id: "m4-q12",
        prompt: "An ALB target group health check failing for an ASG instance typically causes:",
        options: [
          {
            text: "The load balancer to stop sending traffic; ASG can replace the instance if ELB health checks are enabled",
            correct: true,
          },
          {
            text: "Automatic deletion of the VPC",
            correct: false,
          },
          {
            text: "Promotion of the instance to root user",
            correct: false,
          },
          {
            text: "Conversion of EBS to instance store",
            correct: false,
          },
        ],
        explanation:
          "Health checks decouple “process up” from “instance exists.” Wire ALB checks into ASG for self-healing.",
      },
    ],

    module5: [
      {
        id: "m5-q01",
        prompt: "Amazon S3 is best categorized as:",
        options: [
          {
            text: "Object storage accessed via API (bucket/key), not a block device mount",
            correct: true,
          },
          {
            text: "A single-AZ NFS server for Windows only",
            correct: false,
          },
          {
            text: "An EC2 instance store volume type",
            correct: false,
          },
          {
            text: "A Transit Gateway attachment",
            correct: false,
          },
        ],
        explanation:
          "S3 speaks HTTP APIs (SDK/CLI). For POSIX mounts you want EFS/FSx; for disks on one EC2, EBS.",
      },
      {
        id: "m5-q02",
        prompt: "Block Public Access on an S3 bucket is intended to:",
        options: [
          {
            text: "Prevent accidental public exposure via ACLs/policies when enabled",
            correct: true,
          },
          {
            text: "Encrypt objects with customer-provided keys only",
            correct: false,
          },
          {
            text: "Force all objects into Glacier Deep Archive",
            correct: false,
          },
          {
            text: "Disable versioning permanently",
            correct: false,
          },
        ],
        explanation:
          "Public access blocks are a safety rail against common misconfigurations that leak data.",
      },
      {
        id: "m5-q03",
        prompt: "EBS volumes are AZ-scoped. To move a volume’s data to another AZ you typically:",
        options: [
          {
            text: "Create a snapshot, then create a new volume from the snapshot in the target AZ",
            correct: true,
          },
          {
            text: "Change the volume’s AZ attribute in place with a CLI flag",
            correct: false,
          },
          {
            text: "Attach the same volume to instances in two AZs simultaneously without Multi-Attach constraints",
            correct: false,
          },
          {
            text: "Rename the subnet",
            correct: false,
          },
        ],
        explanation:
          "Volumes live in one AZ. Snapshots are the portable recovery/migration primitive (and enable cross-Region copy).",
      },
      {
        id: "m5-q04",
        prompt: "Amazon EFS is a fit when you need:",
        options: [
          {
            text: "A shared NFS filesystem many Linux instances can mount concurrently",
            correct: true,
          },
          {
            text: "Cheapest archival of data untouched for 7 years with 12-hour restores only",
            correct: false,
          },
          {
            text: "GPU passthrough to browsers",
            correct: false,
          },
          {
            text: "Replacement for IAM policies",
            correct: false,
          },
        ],
        explanation:
          "EFS shines for shared content, home directories, and lift-and-shift apps needing NFS semantics.",
      },
      {
        id: "m5-q05",
        prompt: "S3 lifecycle rules are commonly used to:",
        options: [
          {
            text: "Automatically transition or expire objects by prefix/age to control cost",
            correct: true,
          },
          {
            text: "Create new Availability Zones",
            correct: false,
          },
          {
            text: "Rotate IAM user passwords",
            correct: false,
          },
          {
            text: "Resize EC2 instance types weekly",
            correct: false,
          },
        ],
        explanation:
          "Lifecycle automation moves data to colder classes or deletes it — essential for log buckets.",
      },
      {
        id: "m5-q06",
        prompt: "Which storage class family targets rarely accessed archival data with the lowest storage price (and longest retrieval)?",
        options: [
          {
            text: "Amazon S3 Glacier Deep Archive",
            correct: true,
          },
          {
            text: "S3 Standard",
            correct: false,
          },
          {
            text: "EBS io2 Block Express",
            correct: false,
          },
          {
            text: "Instance store NVMe",
            correct: false,
          },
        ],
        explanation:
          "Deep Archive is for long-term retention where restores are rare and can wait hours.",
      },
      {
        id: "m5-q07",
        prompt: "SSE-KMS for S3 means:",
        options: [
          {
            text: "Objects are encrypted server-side using keys managed in AWS KMS (with auditability via CloudTrail)",
            correct: true,
          },
          {
            text: "Encryption happens only in the browser before upload with no server involvement",
            correct: false,
          },
          {
            text: "The bucket must be publicly readable",
            correct: false,
          },
          {
            text: "KMS replaces Bucket Versioning",
            correct: false,
          },
        ],
        explanation:
          "SSE-KMS adds key policies and detailed access logging beyond SSE-S3’s simplicity.",
      },
      {
        id: "m5-q08",
        prompt: "A common cost surprise with EBS is:",
        options: [
          {
            text: "Volumes and snapshots left behind after instances are terminated",
            correct: true,
          },
          {
            text: "EBS requiring a dedicated Region called storage-1",
            correct: false,
          },
          {
            text: "Snapshots automatically deleting after 24 hours always",
            correct: false,
          },
          {
            text: "gp3 volumes being free beyond Free Tier forever",
            correct: false,
          },
        ],
        explanation:
          "Orphaned volumes/snapshots are classic bill leaks. Inventory with tags and AWS Config rules.",
      },
      {
        id: "m5-q09",
        prompt: "AWS Snowball / Snow Family is primarily for:",
        options: [
          {
            text: "Physically shipping large datasets when network transfer is impractical",
            correct: true,
          },
          {
            text: "Running Lambda inside CloudFront PoPs only",
            correct: false,
          },
          {
            text: "Replacing security groups with IAM",
            correct: false,
          },
          {
            text: "Auto Scaling Windows activation keys",
            correct: false,
          },
        ],
        explanation:
          "When petabytes must move, trucks-with-SSDs beat months of WAN copying.",
      },
      {
        id: "m5-q10",
        prompt: "S3 Cross-Region Replication (CRR) helps with:",
        options: [
          {
            text: "Automatic asynchronous copies of objects to a bucket in another Region for DR or locality",
            correct: true,
          },
          {
            text: "Synchronous multi-AZ EBS striping",
            correct: false,
          },
          {
            text: "Disabling versioning on both buckets",
            correct: false,
          },
          {
            text: "Making NACLs stateful",
            correct: false,
          },
        ],
        explanation:
          "CRR needs versioning and IAM permissions; it is async — design RPO accordingly.",
      },
      {
        id: "m5-q11",
        prompt: "gp3 volumes improved on gp2 mainly by:",
        options: [
          {
            text: "Decoupling IOPS/throughput provisioning from volume size more flexibly",
            correct: true,
          },
          {
            text: "Being available only as instance store",
            correct: false,
          },
          {
            text: "Removing encryption support",
            correct: false,
          },
          {
            text: "Requiring cluster placement groups",
            correct: false,
          },
        ],
        explanation:
          "gp3 lets you set performance without oversizing disks just for IOPS — usually better price/performance.",
      },
      {
        id: "m5-q12",
        prompt: "Object Lock in S3 is used to:",
        options: [
          {
            text: "Enforce WORM retention so objects cannot be deleted/overwritten for a period",
            correct: true,
          },
          {
            text: "Lock EC2 instances to a single AZ forever",
            correct: false,
          },
          {
            text: "Prevent IAM users from existing",
            correct: false,
          },
          {
            text: "Compress objects with LZ4 only",
            correct: false,
          },
        ],
        explanation:
          "Object Lock supports compliance/governance retention modes — critical for immutable backups.",
      },
    ],

    module6: [
      {
        id: "m6-q01",
        prompt: "A subnet in a VPC is always associated with:",
        options: [
          {
            text: "Exactly one Availability Zone",
            correct: true,
          },
          {
            text: "Every AZ in the Region simultaneously",
            correct: false,
          },
          {
            text: "A single IAM user",
            correct: false,
          },
          {
            text: "One CloudFront edge location",
            correct: false,
          },
        ],
        explanation:
          "Subnets are AZ-scoped building blocks. Multi-AZ HA means repeating subnet tiers per AZ.",
      },
      {
        id: "m6-q02",
        prompt: "What makes a subnet “public” in practice?",
        options: [
          {
            text: "Its route table sends 0.0.0.0/0 to an Internet Gateway and instances have public/Elastic IPs as needed",
            correct: true,
          },
          {
            text: "It has the word public in the CIDR",
            correct: false,
          },
          {
            text: "It uses only NACLs and no security groups",
            correct: false,
          },
          {
            text: "It is larger than /20",
            correct: false,
          },
        ],
        explanation:
          "Publicness is routing + addressability, not a magic checkbox alone.",
      },
      {
        id: "m6-q03",
        prompt: "NAT Gateway is primarily used so that:",
        options: [
          {
            text: "Private subnet instances can initiate outbound internet connections without being directly reachable inbound",
            correct: true,
          },
          {
            text: "Security groups become optional",
            correct: false,
          },
          {
            text: "S3 buckets become strongly consistent globally",
            correct: false,
          },
          {
            text: "IAM roles can cross Regions",
            correct: false,
          },
        ],
        explanation:
          "NAT provides egress. Place NATs in public subnets; route private 0.0.0.0/0 to them. Consider endpoints to cut NAT cost.",
      },
      {
        id: "m6-q04",
        prompt: "Security groups are stateful, which means:",
        options: [
          {
            text: "Return traffic for an allowed connection is automatically permitted",
            correct: true,
          },
          {
            text: "You must write explicit deny rules for every ephemeral port",
            correct: false,
          },
          {
            text: "They only evaluate at the subnet boundary",
            correct: false,
          },
          {
            text: "They replace Network ACLs entirely and cannot be combined",
            correct: false,
          },
        ],
        explanation:
          "Unlike NACLs, SGs track connection state. That is why they are the primary micro-segmentation tool.",
      },
      {
        id: "m6-q05",
        prompt: "Network ACLs differ from security groups because NACLs:",
        options: [
          {
            text: "Are stateless, subnet-level, and support explicit allow and deny rules with numbers",
            correct: true,
          },
          {
            text: "Attach only to IAM roles",
            correct: false,
          },
          {
            text: "Cannot affect traffic at all",
            correct: false,
          },
          {
            text: "Are evaluated only for IPv6",
            correct: false,
          },
        ],
        explanation:
          "NACLs are coarse fences. Remember ephemeral port allows for return traffic when using custom NACLs.",
      },
      {
        id: "m6-q06",
        prompt: "A gateway VPC endpoint is commonly used for:",
        options: [
          {
            text: "Private connectivity to S3 or DynamoDB via route table prefixes without NAT",
            correct: true,
          },
          {
            text: "Terminating CloudFront TLS at EC2",
            correct: false,
          },
          {
            text: "Creating new Organization units",
            correct: false,
          },
          {
            text: "Assigning Elastic IPs to Lambda",
            correct: false,
          },
        ],
        explanation:
          "Gateway endpoints for S3/DynamoDB keep traffic on the AWS network and can eliminate NAT dependency for those APIs.",
      },
      {
        id: "m6-q07",
        prompt: "VPC peering connections are:",
        options: [
          {
            text: "Non-transitive one-to-one links between two VPCs with non-overlapping CIDRs",
            correct: true,
          },
          {
            text: "Automatically transitive across all peered VPCs like a full mesh hub",
            correct: false,
          },
          {
            text: "Only available inside a single AZ",
            correct: false,
          },
          {
            text: "A replacement for IAM authentication",
            correct: false,
          },
        ],
        explanation:
          "If A peers B and B peers C, A does not reach C through B. Use Transit Gateway for hub-and-spoke transitive routing.",
      },
      {
        id: "m6-q08",
        prompt: "AWS Transit Gateway is best characterized as:",
        options: [
          {
            text: "A regional hub for connecting many VPCs and on-prem networks with transitive routing",
            correct: true,
          },
          {
            text: "A CloudFront PoP type",
            correct: false,
          },
          {
            text: "An EBS volume encryption mode",
            correct: false,
          },
          {
            text: "A Free Tier-only NAT device",
            correct: false,
          },
        ],
        explanation:
          "TGW scales multi-VPC connectivity better than sprawling peering meshes.",
      },
      {
        id: "m6-q09",
        prompt: "Best practice for tiered apps: allow App SG to reach DB on 5432 by:",
        options: [
          {
            text: "Referencing the App security group ID as the source on the DB security group rule",
            correct: true,
          },
          {
            text: "Opening 0.0.0.0/0 on the DB SG for convenience",
            correct: false,
          },
          {
            text: "Disabling NACLs and SGs together",
            correct: false,
          },
          {
            text: "Putting the database in a public subnet with a public IP",
            correct: false,
          },
        ],
        explanation:
          "SG-to-SG references track fleet changes without brittle IP lists and keep DBs private.",
      },
      {
        id: "m6-q10",
        prompt: "Interface VPC endpoints (PrivateLink) create:",
        options: [
          {
            text: "ENIs in your subnets that privately reach supported AWS or partner services",
            correct: true,
          },
          {
            text: "A new public Internet Gateway per AZ automatically",
            correct: false,
          },
          {
            text: "Cross-Region VPC CIDR overlaps on purpose",
            correct: false,
          },
          {
            text: "Root user access keys",
            correct: false,
          },
        ],
        explanation:
          "Interface endpoints bring SSM, ECR, Secrets Manager, etc. into private subnets — often worth the cost for security.",
      },
      {
        id: "m6-q11",
        prompt: "When planning VPC CIDRs across accounts, you should:",
        options: [
          {
            text: "Avoid overlapping ranges so peering/TGW connectivity remains possible later",
            correct: true,
          },
          {
            text: "Reuse 10.0.0.0/16 everywhere without documentation",
            correct: false,
          },
          {
            text: "Always use public 1.1.1.0/24 space inside VPCs",
            correct: false,
          },
          {
            text: "Match CIDR size to the number of IAM users",
            correct: false,
          },
        ],
        explanation:
          "Overlapping CIDRs block connectivity designs. Allocate a private IPAM plan early.",
      },
      {
        id: "m6-q12",
        prompt: "VPC Reachability Analyzer helps you:",
        options: [
          {
            text: "Prove whether a path between two ENIs/resources is reachable given routes/SG/NACL",
            correct: true,
          },
          {
            text: "Automatically increase Spot bids",
            correct: false,
          },
          {
            text: "Generate IAM access keys",
            correct: false,
          },
          {
            text: "Convert NACLs into security groups",
            correct: false,
          },
        ],
        explanation:
          "It models the network path — faster than guessing which layer dropped packets.",
      },
      {
        id: "m6-q13",
        prompt: "Direct Connect differs from Site-to-Site VPN mainly by:",
        options: [
          {
            text: "Providing private dedicated connectivity with more consistent bandwidth/latency characteristics",
            correct: true,
          },
          {
            text: "Being a free replacement for all IAM controls",
            correct: false,
          },
          {
            text: "Only working with public S3 buckets",
            correct: false,
          },
          {
            text: "Requiring every subnet to be public",
            correct: false,
          },
        ],
        explanation:
          "VPN is encrypted over internet quickly; DX is private circuit-style connectivity for serious hybrid estates (often with VPN backup).",
      },
      {
        id: "m6-q14",
        prompt: "enableDnsHostnames / enableDnsSupport on a VPC matter because they:",
        options: [
          {
            text: "Affect AWS-provided DNS behavior needed for private hosted zones and many endpoint patterns",
            correct: true,
          },
          {
            text: "Disable all security groups",
            correct: false,
          },
          {
            text: "Force IPv6-only addressing",
            correct: false,
          },
          {
            text: "Move the VPC to another Region",
            correct: false,
          },
        ],
        explanation:
          "DNS settings are easy to miss and break private Route 53 zones, SSM endpoints, and hostname resolution.",
      },
    ],

    module7: [
      {
        id: "m7-q01",
        prompt: "When is Amazon DynamoDB generally a better fit than RDS?",
        options: [
          {
            text: "When access patterns are key-based and you need massive seamless scale",
            correct: true,
          },
          {
            text: "When you need complex multi-table SQL joins as the primary workload",
            correct: false,
          },
          {
            text: "When you must mount an NFS filesystem from EC2",
            correct: false,
          },
          {
            text: "When you only need a CDN cache",
            correct: false,
          },
        ],
        explanation:
          "DynamoDB excels at simple, well-known access patterns at high scale. Heavy relational joins usually belong in RDS/Aurora (or a warehouse for analytics).",
      },
      {
        id: "m7-q02",
        prompt: "RDS Multi-AZ primarily provides:",
        options: [
          {
            text: "High availability via a synchronous standby in another AZ with automatic failover",
            correct: true,
          },
          {
            text: "Automatic sharding across Regions",
            correct: false,
          },
          {
            text: "Replacement for IAM authentication",
            correct: false,
          },
          {
            text: "Free unlimited IOPS forever",
            correct: false,
          },
        ],
        explanation:
          "Classic Multi-AZ is HA, not read scale-out. Use read replicas for scaling reads.",
      },
      {
        id: "m7-q03",
        prompt: "Aurora’s distinctive architectural idea is:",
        options: [
          {
            text: "Decoupling compute from a distributed multi-AZ storage volume",
            correct: true,
          },
          {
            text: "Running only on customer Outposts hardware",
            correct: false,
          },
          {
            text: "Storing all rows exclusively in CloudFront",
            correct: false,
          },
          {
            text: "Removing the need for security groups",
            correct: false,
          },
        ],
        explanation:
          "Aurora storage is a shared, replicated volume; writers/readers are compute endpoints on top.",
      },
      {
        id: "m7-q04",
        prompt: "A DynamoDB “hot partition” problem usually means:",
        options: [
          {
            text: "Too much traffic concentrates on one partition key value",
            correct: true,
          },
          {
            text: "The table is encrypted with SSE-S3",
            correct: false,
          },
          {
            text: "TTL is enabled",
            correct: false,
          },
          {
            text: "Streams are turned off",
            correct: false,
          },
        ],
        explanation:
          "Partition keys must distribute load. Hot keys cause throttling even when table-level capacity looks fine.",
      },
      {
        id: "m7-q05",
        prompt: "ElastiCache is typically used to:",
        options: [
          {
            text: "Cache hot data / sessions in-memory to reduce database load and latency",
            correct: true,
          },
          {
            text: "Replace VPC route tables",
            correct: false,
          },
          {
            text: "Store Glacier Deep Archive objects",
            correct: false,
          },
          {
            text: "Issue ACM certificates",
            correct: false,
          },
        ],
        explanation:
          "Redis/Memcached accelerate reads and ephemeral state. Still protect with SGs and design invalidation.",
      },
      {
        id: "m7-q06",
        prompt: "Amazon Athena is best described as:",
        options: [
          {
            text: "Serverless SQL query service over data in S3 (and related lake sources)",
            correct: true,
          },
          {
            text: "A Multi-AZ MySQL engine on EC2",
            correct: false,
          },
          {
            text: "A Transit Gateway attachment type",
            correct: false,
          },
          {
            text: "An IAM permission boundary",
            correct: false,
          },
        ],
        explanation:
          "Athena queries the data lake without standing up a warehouse cluster for ad-hoc SQL.",
      },
      {
        id: "m7-q07",
        prompt: "Why keep RDS/Aurora in private subnets?",
        options: [
          {
            text: "To avoid direct internet exposure; allow only app-tier security groups",
            correct: true,
          },
          {
            text: "Because databases cannot resolve DNS in public subnets",
            correct: false,
          },
          {
            text: "Private subnets disable all backups",
            correct: false,
          },
          {
            text: "KMS only works privately",
            correct: false,
          },
        ],
        explanation:
          "Data stores belong behind private networking and tight SG references — a core reliability/security practice.",
      },
      {
        id: "m7-q08",
        prompt: "DynamoDB Global Tables provide:",
        options: [
          {
            text: "Multi-Region replication for active-active style access with conflict considerations",
            correct: true,
          },
          {
            text: "Automatic conversion of items into RDS rows",
            correct: false,
          },
          {
            text: "Free CloudFront distributions",
            correct: false,
          },
          {
            text: "Replacement for partition keys",
            correct: false,
          },
        ],
        explanation:
          "Global Tables replicate across Regions. Understand last-writer-wins style conflicts for your app.",
      },
      {
        id: "m7-q09",
        prompt: "RDS read replicas are primarily for:",
        options: [
          {
            text: "Scaling read traffic (and sometimes cross-Region DR patterns)",
            correct: true,
          },
          {
            text: "Synchronous zero-lag HA identical to Multi-AZ standby semantics always",
            correct: false,
          },
          {
            text: "Encrypting S3 objects",
            correct: false,
          },
          {
            text: "Replacing security groups",
            correct: false,
          },
        ],
        explanation:
          "Replicas are async — expect lag. Multi-AZ standby is the classic sync HA pattern for the writer.",
      },
      {
        id: "m7-q10",
        prompt: "Connection storms from Lambda to RDS are often mitigated with:",
        options: [
          {
            text: "RDS Proxy (or another pooling layer) plus careful concurrency limits",
            correct: true,
          },
          {
            text: "Making the database publicly accessible",
            correct: false,
          },
          {
            text: "Disabling TLS",
            correct: false,
          },
          {
            text: "Using only instance store on the DB host",
            correct: false,
          },
        ],
        explanation:
          "Many short-lived Lambda environments can exhaust DB max_connections — pool and bound concurrency.",
      },
      {
        id: "m7-q11",
        prompt: "Redshift’s primary role in the AWS data map is:",
        options: [
          {
            text: "Cloud data warehousing for analytical SQL / BI workloads",
            correct: true,
          },
          {
            text: "Replacing IAM Identity Center",
            correct: false,
          },
          {
            text: "Edge TLS termination only",
            correct: false,
          },
          {
            text: "EC2 placement group management",
            correct: false,
          },
        ],
        explanation:
          "Warehouses serve analytics; OLTP systems serve transactions. Keep the workloads apart.",
      },
      {
        id: "m7-q12",
        prompt: "Before relying on automated RDS backups in production you should:",
        options: [
          {
            text: "Test restore procedures and know your RPO/RTO",
            correct: true,
          },
          {
            text: "Disable Multi-AZ to make backups faster",
            correct: false,
          },
          {
            text: "Store the master password in a public GitHub repo",
            correct: false,
          },
          {
            text: "Turn off encryption so snapshots are smaller",
            correct: false,
          },
        ],
        explanation:
          "Untested backups are fiction. Restore drills validate both tech and runbooks.",
      },
    ],

    module8: [
      {
        id: "m8-q01",
        prompt: "AWS Lambda pricing is primarily based on:",
        options: [
          {
            text: "Requests and compute duration (memory × time), plus optional extras",
            correct: true,
          },
          {
            text: "Number of VPCs attached only",
            correct: false,
          },
          {
            text: "Number of IAM users in the account",
            correct: false,
          },
          {
            text: "Always a fixed monthly EC2 reservation",
            correct: false,
          },
        ],
        explanation:
          "Serverless bills for invokes and GB-seconds (and related features). Idle often costs near-zero.",
      },
      {
        id: "m8-q02",
        prompt: "API Gateway HTTP APIs vs REST APIs — a fair generalization is:",
        options: [
          {
            text: "HTTP APIs are simpler/cheaper for many common Lambda/JWT use cases; REST APIs offer a broader classic feature set",
            correct: true,
          },
          {
            text: "HTTP APIs only work with EC2",
            correct: false,
          },
          {
            text: "REST APIs cannot use TLS",
            correct: false,
          },
          {
            text: "They are identical products with two names",
            correct: false,
          },
        ],
        explanation:
          "Pick based on features needed (usage plans, integrations, etc.) vs cost/simplicity.",
      },
      {
        id: "m8-q03",
        prompt: "SQS dead-letter queues (DLQs) help you:",
        options: [
          {
            text: "Isolate messages that repeatedly fail processing for later inspection",
            correct: true,
          },
          {
            text: "Automatically delete the VPC",
            correct: false,
          },
          {
            text: "Increase DynamoDB RCU for free",
            correct: false,
          },
          {
            text: "Bypass IAM authorization",
            correct: false,
          },
        ],
        explanation:
          "DLQs prevent poison messages from blocking the main queue forever and aid debugging.",
      },
      {
        id: "m8-q04",
        prompt: "Amazon EventBridge is primarily:",
        options: [
          {
            text: "An event bus with rules to route events to targets based on patterns",
            correct: true,
          },
          {
            text: "A block storage volume type",
            correct: false,
          },
          {
            text: "A CloudFront price class",
            correct: false,
          },
          {
            text: "An EC2 tenancy option",
            correct: false,
          },
        ],
        explanation:
          "EventBridge connects producers to consumers with content-based filtering — great for decoupled architectures.",
      },
      {
        id: "m8-q05",
        prompt: "Putting Lambda inside a VPC is sometimes necessary but can:",
        options: [
          {
            text: "Add networking constraints and should be used when private resource access requires it",
            correct: true,
          },
          {
            text: "Remove the need for an execution role",
            correct: false,
          },
          {
            text: "Make the function run on the customer laptop",
            correct: false,
          },
          {
            text: "Disable CloudWatch Logs permanently",
            correct: false,
          },
        ],
        explanation:
          "VPC-enabled functions need subnet/SG planning (and still need an execution role). Prefer public AWS APIs or VPC endpoints when possible; VPC-attach when reaching private RDS/ElastiCache/etc. Hyperplane improved ENI cold starts, but VPC placement remains an intentional tradeoff.",
      },
      {
        id: "m8-q06",
        prompt: "ECS Fargate differs from ECS on EC2 mainly because:",
        options: [
          {
            text: "Fargate runs tasks without you managing the underlying container instances",
            correct: true,
          },
          {
            text: "Fargate cannot pull from ECR",
            correct: false,
          },
          {
            text: "EC2 launch type forbids load balancers",
            correct: false,
          },
          {
            text: "Fargate replaces IAM entirely",
            correct: false,
          },
        ],
        explanation:
          "Fargate = serverless containers for many apps; EC2 launch type = more control/density responsibilities.",
      },
      {
        id: "m8-q07",
        prompt: "Amazon EKS provides:",
        options: [
          {
            text: "A managed Kubernetes control plane with you operating workloads (and often nodes/Fargate profiles)",
            correct: true,
          },
          {
            text: "A replacement for Route 53",
            correct: false,
          },
          {
            text: "Only Windows desktop streaming",
            correct: false,
          },
          {
            text: "Automatic public S3 buckets",
            correct: false,
          },
        ],
        explanation:
          "EKS is for teams standardized on Kubernetes. More power, more operational surface than ECS for many.",
      },
      {
        id: "m8-q08",
        prompt: "Step Functions are most valuable when:",
        options: [
          {
            text: "You need managed workflow orchestration with retries, branching, and visibility",
            correct: true,
          },
          {
            text: "You want to avoid all IAM policies",
            correct: false,
          },
          {
            text: "You only need a single DNS A record",
            correct: false,
          },
          {
            text: "You must disable CloudTrail",
            correct: false,
          },
        ],
        explanation:
          "Orchestration-as-state-machine beats brittle nested callback chains for business workflows.",
      },
      {
        id: "m8-q09",
        prompt: "Provisioned concurrency on Lambda is used to:",
        options: [
          {
            text: "Keep initialized execution environments ready to reduce cold starts",
            correct: true,
          },
          {
            text: "Provision EC2 Dedicated Hosts automatically",
            correct: false,
          },
          {
            text: "Create new AWS accounts",
            correct: false,
          },
          {
            text: "Force all invokes through us-east-1",
            correct: false,
          },
        ],
        explanation:
          "Pay to keep warm capacity for latency-sensitive synchronous APIs.",
      },
      {
        id: "m8-q10",
        prompt: "SNS vs SQS — which pairing statement is accurate?",
        options: [
          {
            text: "SNS fans out messages to subscribers; SQS buffers messages for consumers to pull/process",
            correct: true,
          },
          {
            text: "SQS can only send email",
            correct: false,
          },
          {
            text: "SNS stores messages for 14 days for a single consumer only by default design",
            correct: false,
          },
          {
            text: "They are the same service",
            correct: false,
          },
        ],
        explanation:
          "Classic pattern: SNS publish → SQS queues per consumer → workers/Lambda.",
      },
      {
        id: "m8-q11",
        prompt: "ECR’s role in container deployments is to:",
        options: [
          {
            text: "Store and serve container images to ECS/EKS/Lambda (image) pullers",
            correct: true,
          },
          {
            text: "Replace ALB health checks",
            correct: false,
          },
          {
            text: "Allocate Elastic IPs to pods only",
            correct: false,
          },
          {
            text: "Manage Organizations SCPs",
            correct: false,
          },
        ],
        explanation:
          "Push images to ECR, grant pull permissions via IAM, scan for CVEs.",
      },
      {
        id: "m8-q12",
        prompt: "Why design Lambda consumers to be idempotent?",
        options: [
          {
            text: "Event sources often provide at-least-once delivery, so duplicates can occur",
            correct: true,
          },
          {
            text: "IAM requires idempotent handlers to attach roles",
            correct: false,
          },
          {
            text: "VPC subnets reject non-idempotent code",
            correct: false,
          },
          {
            text: "CloudFront caches only non-idempotent responses",
            correct: false,
          },
        ],
        explanation:
          "Retries and duplicate delivers are normal. Use idempotency keys / conditional writes.",
      },
    ],

    module9: [
      {
        id: "m9-q01",
        prompt: "Which trio best represents observability pillars?",
        options: [
          {
            text: "Metrics, logs, and traces",
            correct: true,
          },
          {
            text: "CIDR, AMI, and IGW",
            correct: false,
          },
          {
            text: "Spot, Reserved, and Dedicated",
            correct: false,
          },
          {
            text: "SCP, NACL, and TTL",
            correct: false,
          },
        ],
        explanation:
          "Metrics detect, logs explain, traces locate cross-service latency — use all three deliberately.",
      },
      {
        id: "m9-q02",
        prompt: "CloudWatch Alarms commonly notify operators via:",
        options: [
          {
            text: "Amazon SNS (email, Chatbot, Pager integrations, etc.)",
            correct: true,
          },
          {
            text: "Direct modification of IAM root password",
            correct: false,
          },
          {
            text: "Automatic deletion of CloudTrail",
            correct: false,
          },
          {
            text: "Opening all security groups",
            correct: false,
          },
        ],
        explanation:
          "Alarms evaluate metrics; actions typically publish to SNS or Auto Scaling policies.",
      },
      {
        id: "m9-q03",
        prompt: "AWS X-Ray helps primarily with:",
        options: [
          {
            text: "Distributed tracing and service maps across request paths",
            correct: true,
          },
          {
            text: "Allocating Elastic IPs",
            correct: false,
          },
          {
            text: "Creating Organizations",
            correct: false,
          },
          {
            text: "Pricing Calculator estimates only",
            correct: false,
          },
        ],
        explanation:
          "Traces show where time is spent across API GW, Lambda, HTTP clients, and more.",
      },
      {
        id: "m9-q04",
        prompt: "CloudTrail is essential because it records:",
        options: [
          {
            text: "API activity (who did what, when) for audit and forensics",
            correct: true,
          },
          {
            text: "Only VPC Flow Logs",
            correct: false,
          },
          {
            text: "Only S3 object GET bytes",
            correct: false,
          },
          {
            text: "CPU steal time on hypervisors exclusively",
            correct: false,
          },
        ],
        explanation:
          "Without Trail, investigating suspicious control-plane activity is guesswork.",
      },
      {
        id: "m9-q05",
        prompt: "AWS Config is used to:",
        options: [
          {
            text: "Track resource configurations and evaluate compliance rules over time",
            correct: true,
          },
          {
            text: "Replace Route 53 health checks",
            correct: false,
          },
          {
            text: "Build AMIs from Dockerfiles",
            correct: false,
          },
          {
            text: "Terminate NAT Gateways hourly by default",
            correct: false,
          },
        ],
        explanation:
          "Config answers “was this bucket public yesterday?” and enforces guardrail rules.",
      },
      {
        id: "m9-q06",
        prompt: "SSM Session Manager’s security benefit is:",
        options: [
          {
            text: "Interactive instance access without opening inbound SSH from the internet",
            correct: true,
          },
          {
            text: "Disabling all IAM policies automatically",
            correct: false,
          },
          {
            text: "Making EBS unencrypted",
            correct: false,
          },
          {
            text: "Bypassing VPC routing",
            correct: false,
          },
        ],
        explanation:
          "Session Manager uses SSM agents + IAM — prefer it over bastion+22/0.0.0.0/0 patterns.",
      },
      {
        id: "m9-q07",
        prompt: "GuardDuty analyzes account activity to:",
        options: [
          {
            text: "Surface threat findings (suspicious API use, malware hints, unusual DNS, etc.)",
            correct: true,
          },
          {
            text: "Automatically resize ASGs to zero",
            correct: false,
          },
          {
            text: "Issue ACM certificates",
            correct: false,
          },
          {
            text: "Create Transit Gateways",
            correct: false,
          },
        ],
        explanation:
          "GuardDuty is detection — you still need response playbooks for findings.",
      },
      {
        id: "m9-q08",
        prompt: "A backup strategy without restore tests is weak because:",
        options: [
          {
            text: "You have not validated RPO/RTO or that restores actually work",
            correct: true,
          },
          {
            text: "AWS deletes all snapshots after 24 hours always",
            correct: false,
          },
          {
            text: "CloudWatch cannot alarm on backup jobs",
            correct: false,
          },
          {
            text: "IAM forbids restores in all accounts",
            correct: false,
          },
        ],
        explanation:
          "Rehearse restores in non-prod. Treat DR as a practiced skill.",
      },
      {
        id: "m9-q09",
        prompt: "CloudWatch Logs Insights is for:",
        options: [
          {
            text: "Interactive queries over log data to find errors and patterns",
            correct: true,
          },
          {
            text: "Creating VPC CIDRs",
            correct: false,
          },
          {
            text: "Managing KMS key rotation only",
            correct: false,
          },
          {
            text: "Purchasing Savings Plans",
            correct: false,
          },
        ],
        explanation:
          "Insights is the investigative scalpel once an alarm fires.",
      },
      {
        id: "m9-q10",
        prompt: "Parameter Store / Secrets Manager help operations by:",
        options: [
          {
            text: "Centralizing configuration and secrets instead of hardcoding them in images",
            correct: true,
          },
          {
            text: "Replacing security groups",
            correct: false,
          },
          {
            text: "Provisioning public IPs for RDS",
            correct: false,
          },
          {
            text: "Disabling MFA requirements",
            correct: false,
          },
        ],
        explanation:
          "Inject config at runtime with IAM-controlled access and rotation options (Secrets Manager).",
      },
      {
        id: "m9-q11",
        prompt: "Infrastructure as Code (CloudFormation/Terraform/CDK) supports ops excellence by:",
        options: [
          {
            text: "Making environments reproducible, reviewable, and less click-ops fragile",
            correct: true,
          },
          {
            text: "Eliminating the need for monitoring",
            correct: false,
          },
          {
            text: "Guaranteeing zero AWS spend",
            correct: false,
          },
          {
            text: "Removing shared responsibility",
            correct: false,
          },
        ],
        explanation:
          "IaC is how changes become auditable pull requests instead of undocumented console clicks.",
      },
      {
        id: "m9-q12",
        prompt: "Golden signals commonly tracked on dashboards include:",
        options: [
          {
            text: "Latency, traffic, errors, and saturation",
            correct: true,
          },
          {
            text: "Only the number of IAM groups",
            correct: false,
          },
          {
            text: "Only AZ letter mappings",
            correct: false,
          },
          {
            text: "Only the count of CNAME files in git",
            correct: false,
          },
        ],
        explanation:
          "These four (from Google SRE lore) map cleanly onto CloudWatch metrics for most services.",
      },
    ],

    module10: [
      {
        id: "m10-q01",
        prompt: "How many pillars does the AWS Well-Architected Framework currently emphasize in this course’s capstone framing?",
        options: [
          {
            text: "Six — including Sustainability alongside the classic five",
            correct: true,
          },
          {
            text: "Two — only Security and Cost",
            correct: false,
          },
          {
            text: "Twelve — one per AWS Region family",
            correct: false,
          },
          {
            text: "Zero — WA is deprecated",
            correct: false,
          },
        ],
        explanation:
          "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability.",
      },
      {
        id: "m10-q02",
        prompt: "Placing CloudFront + WAF in front of a public API primarily supports which concerns?",
        options: [
          {
            text: "Performance (edge caching/TLS) and Security (edge filtering)",
            correct: true,
          },
          {
            text: "Eliminating the need for IAM entirely",
            correct: false,
          },
          {
            text: "Making DynamoDB single-AZ only",
            correct: false,
          },
          {
            text: "Disabling CloudTrail logs",
            correct: false,
          },
        ],
        explanation:
          "Edge improves latency and absorbs common web attacks before they hit origin.",
      },
      {
        id: "m10-q03",
        prompt: "A Reliability pillar action for the Orbit Catalog API would be:",
        options: [
          {
            text: "Multi-AZ data plane, DLQs for async failures, and tested backups with defined RPO/RTO",
            correct: true,
          },
          {
            text: "Running the database on a laptop in one office",
            correct: false,
          },
          {
            text: "Using a single AZ to reduce complexity always",
            correct: false,
          },
          {
            text: "Storing backups only in the same EBS volume as prod",
            correct: false,
          },
        ],
        explanation:
          "Reliability is failure management: isolation, retries, backups, and rehearsed recovery.",
      },
      {
        id: "m10-q04",
        prompt: "Cost Optimization for this architecture might include:",
        options: [
          {
            text: "S3 lifecycle rules, right-sized Lambda memory, Budgets, and endpoints to reduce NAT spend",
            correct: true,
          },
          {
            text: "Leaving unused NAT Gateways and orphaned volumes indefinitely",
            correct: false,
          },
          {
            text: "Provisioning the largest EC2 size “just in case” with no metrics",
            correct: false,
          },
          {
            text: "Disabling all alarms to save SNS pennies while risking outages",
            correct: false,
          },
        ],
        explanation:
          "Cost is continuous measurement and elimination of waste — not reckless under-provisioning.",
      },
      {
        id: "m10-q05",
        prompt: "Choosing DynamoDB for the catalog hot path is mainly a Performance Efficiency / design choice when:",
        options: [
          {
            text: "Key-based item access patterns are known and scale matters",
            correct: true,
          },
          {
            text: "You require arbitrary multi-join analytical SQL on live traffic",
            correct: false,
          },
          {
            text: "You need SMB file shares for Windows clients",
            correct: false,
          },
          {
            text: "You must avoid IAM roles on compute",
            correct: false,
          },
        ],
        explanation:
          "Match database to access pattern — a recurring Well-Architected performance theme.",
      },
      {
        id: "m10-q06",
        prompt: "Operational Excellence emphasizes:",
        options: [
          {
            text: "IaC, automated deployments, runbooks, and learning from operations events",
            correct: true,
          },
          {
            text: "Only manual console changes with no documentation",
            correct: false,
          },
          {
            text: "Avoiding monitoring to reduce noise",
            correct: false,
          },
          {
            text: "Sharing root credentials for faster response",
            correct: false,
          },
        ],
        explanation:
          "Ops excellence is about how you change and run systems — culture + automation + feedback.",
      },
      {
        id: "m10-q07",
        prompt: "A Security pillar anti-pattern in the capstone would be:",
        options: [
          {
            text: "Publicly accessible database and long-lived keys in the Lambda image",
            correct: true,
          },
          {
            text: "Least-privilege execution roles and private data stores",
            correct: false,
          },
          {
            text: "WAF associated with CloudFront",
            correct: false,
          },
          {
            text: "CloudTrail enabled in the account",
            correct: false,
          },
        ],
        explanation:
          "Public data stores and embedded secrets are classic high-severity WA risks.",
      },
      {
        id: "m10-q08",
        prompt: "Sustainability improvements can include:",
        options: [
          {
            text: "Efficient hardware choices (e.g., Graviton), scaling idle capacity down, and caching to cut wasted work",
            correct: true,
          },
          {
            text: "Running idle fleets at max size 24/7 for “warmth”",
            correct: false,
          },
          {
            text: "Duplicating every object to all Regions without need",
            correct: false,
          },
          {
            text: "Disabling compression everywhere",
            correct: false,
          },
        ],
        explanation:
          "Less wasted compute and data movement generally means better sustainability and often lower cost.",
      },
      {
        id: "m10-q09",
        prompt: "When documenting architecture tradeoffs, a senior engineer should:",
        options: [
          {
            text: "Make alternatives and reasons explicit (e.g., Lambda vs ECS) so future reviews are informed",
            correct: true,
          },
          {
            text: "Hide decisions so audits take longer",
            correct: false,
          },
          {
            text: "Always pick the newest service regardless of fit",
            correct: false,
          },
          {
            text: "Avoid writing ADRs because memory is enough",
            correct: false,
          },
        ],
        explanation:
          "Conscious tradeoffs are the point of Well-Architected — not cargo-cult service lists.",
      },
      {
        id: "m10-q10",
        prompt: "The AWS Well-Architected Tool is used to:",
        options: [
          {
            text: "Review workloads against pillar questions, track risks, and plan improvements",
            correct: true,
          },
          {
            text: "Compile C++ for Graviton automatically",
            correct: false,
          },
          {
            text: "Replace VPC peering with magic DNS",
            correct: false,
          },
          {
            text: "Generate root access keys weekly",
            correct: false,
          },
        ],
        explanation:
          "WA Tool structures reviews and improvement plans — pair it with real evidence from your architecture.",
      },
      {
        id: "m10-q11",
        prompt: "Async image processing via SQS → Lambda in the reference design mainly improves:",
        options: [
          {
            text: "Reliability and performance of the user-facing write path by decoupling heavy work",
            correct: true,
          },
          {
            text: "The need to never monitor failures",
            correct: false,
          },
          {
            text: "Mandatory public S3 ACLs",
            correct: false,
          },
          {
            text: "Removal of all IAM checks",
            correct: false,
          },
        ],
        explanation:
          "Decoupling keeps APIs snappy and isolates failures — with DLQs for poison messages.",
      },
      {
        id: "m10-q12",
        prompt: "After finishing this masterclass, a strong next practice is to:",
        options: [
          {
            text: "Implement a small end-to-end workload with IaC, alarms, and a mini WA review",
            correct: true,
          },
          {
            text: "Memorize every service name without building anything",
            correct: false,
          },
          {
            text: "Disable MFA for convenience",
            correct: false,
          },
          {
            text: "Use root access keys in CI",
            correct: false,
          },
        ],
        explanation:
          "Skill locks in through building and reviewing — the capstone architecture is your template.",
      },
    ],
  };

  /* --------------------------------------------------------------------------
   * Utilities
   * ------------------------------------------------------------------------ */
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleInPlace(arr, rand) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Shuffle options; if a whole quiz skews toward one letter, rebalance by
   * rotating each question's options so correct answers spread across A–D.
   */
  function prepareQuestions(questions, quizKey) {
    const prepared = questions.map((q, index) => {
      const rand = mulberry32(hashString(`${quizKey}:${q.id}:opts`));
      const options = q.options.map((o) => ({ ...o }));
      shuffleInPlace(options, rand);
      return { ...q, options, index };
    });

    // Balance correct-answer letters across the quiz
    const targetCounts = [0, 0, 0, 0];
    const n = prepared.length;
    for (let i = 0; i < n; i += 1) targetCounts[i % 4] += 1;

    const current = [0, 0, 0, 0];
    prepared.forEach((q) => {
      const correctIdx = q.options.findIndex((o) => o.correct);
      current[correctIdx] += 1;
    });

    prepared.forEach((q) => {
      let correctIdx = q.options.findIndex((o) => o.correct);
      // Prefer a letter that is still under its target share
      let bestSlot = correctIdx;
      let bestScore = Infinity;
      for (let slot = 0; slot < 4; slot += 1) {
        const projected = current[slot] - (slot === correctIdx ? 1 : 0) + 1;
        const overflow = projected - targetCounts[slot];
        const score = overflow * 10 + Math.abs(slot - (q.index % 4));
        if (score < bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      }
      if (bestSlot !== correctIdx) {
        const opts = q.options.slice();
        const [correctOpt] = opts.splice(correctIdx, 1);
        opts.splice(bestSlot, 0, correctOpt);
        current[correctIdx] -= 1;
        current[bestSlot] += 1;
        q.options = opts;
      }
    });

    return prepared;
  }

  const LETTERS = ["A", "B", "C", "D"];

  /* --------------------------------------------------------------------------
   * Quiz rendering
   * ------------------------------------------------------------------------ */
  function renderQuiz(root) {
    const key = root.dataset.quiz;
    const bank = QUIZ_BANK[key];
    if (!bank || !bank.length) {
      root.innerHTML =
        '<p class="text-slate-400 text-sm">Quiz coming soon for this module.</p>';
      return;
    }

    const questions = prepareQuestions(bank, key);
    const state = {
      answers: {},
      score: null,
    };

    root.innerHTML = "";
    root.classList.add("space-y-6");

    const header = document.createElement("div");
    header.className =
      "flex flex-wrap items-end justify-between gap-3 border-b border-cyan-500/20 pb-4";
    header.innerHTML = `
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-cyan-400/80">Mission Check</p>
        <h3 class="font-display text-xl text-starlight mt-1">Module Quiz · ${questions.length} questions</h3>
      </div>
      <div class="text-sm text-slate-400" data-quiz-score>Unsubmitted</div>
    `;
    root.appendChild(header);

    const list = document.createElement("div");
    list.className = "space-y-5";
    root.appendChild(list);

    questions.forEach((q, qi) => {
      const card = document.createElement("article");
      card.className =
        "rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-[0_0_40px_-20px_rgba(34,211,238,0.35)]";
      card.dataset.questionId = q.id;

      const optsHtml = q.options
        .map((opt, oi) => {
          const id = `${q.id}-${oi}`;
          return `
            <label class="quiz-option group flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-3 transition hover:border-cyan-400/40 hover:bg-slate-900">
              <input type="radio" class="mt-1 accent-cyan-400" name="${q.id}" value="${oi}" id="${id}" />
              <span class="flex gap-3">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/30">${LETTERS[oi]}</span>
                <span class="text-sm leading-relaxed text-slate-200">${escapeHtml(opt.text)}</span>
              </span>
            </label>
          `;
        })
        .join("");

      card.innerHTML = `
        <p class="text-xs font-medium uppercase tracking-wider text-amber-300/80">Question ${qi + 1}</p>
        <h4 class="mt-2 text-base font-medium leading-relaxed text-starlight">${escapeHtml(q.prompt)}</h4>
        <div class="mt-4 space-y-2" data-options>${optsHtml}</div>
        <div class="mt-4 hidden" data-reveal>
          <button type="button" class="explain-toggle flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-400/30">
            <span data-result-label>Reveal explanation</span>
            <svg class="h-4 w-4 text-cyan-300 transition group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
          </button>
          <div class="explain-panel mt-2 hidden rounded-xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-3 text-sm leading-relaxed text-slate-300" data-explain></div>
        </div>
      `;

      list.appendChild(card);

      card.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener("change", () => {
          state.answers[q.id] = Number(input.value);
          updateLiveSelection(card, q, Number(input.value));
        });
      });

      const toggle = card.querySelector(".explain-toggle");
      const panel = card.querySelector("[data-explain]");
      toggle.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        toggle.setAttribute(
          "aria-expanded",
          panel.classList.contains("hidden") ? "false" : "true"
        );
      });
    });

    const actions = document.createElement("div");
    actions.className = "flex flex-wrap gap-3 pt-2";
    actions.innerHTML = `
      <button type="button" data-action="submit" class="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110">
        Submit answers
      </button>
      <button type="button" data-action="reset" class="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10">
        Reset quiz
      </button>
    `;
    root.appendChild(actions);

    const scoreEl = header.querySelector("[data-quiz-score]");

    actions.querySelector('[data-action="submit"]').addEventListener("click", () => {
      let correct = 0;
      questions.forEach((q) => {
        const card = list.querySelector(`[data-question-id="${q.id}"]`);
        const chosen = state.answers[q.id];
        const reveal = card.querySelector("[data-reveal]");
        const panel = card.querySelector("[data-explain]");
        const label = card.querySelector("[data-result-label]");
        reveal.classList.remove("hidden");

        const correctIdx = q.options.findIndex((o) => o.correct);
        const isCorrect = chosen === correctIdx;
        if (isCorrect) correct += 1;

        card.querySelectorAll(".quiz-option").forEach((lab, oi) => {
          lab.classList.remove(
            "ring-2",
            "ring-emerald-400/70",
            "ring-rose-400/70",
            "border-emerald-400/50",
            "border-rose-400/50"
          );
          if (oi === correctIdx) {
            lab.classList.add("ring-2", "ring-emerald-400/70", "border-emerald-400/50");
          } else if (chosen === oi) {
            lab.classList.add("ring-2", "ring-rose-400/70", "border-rose-400/50");
          }
        });

        label.textContent = isCorrect
          ? `Correct — ${LETTERS[correctIdx]}`
          : chosen == null
            ? `Unanswered — correct is ${LETTERS[correctIdx]}`
            : `Incorrect — correct is ${LETTERS[correctIdx]}`;
        label.className = isCorrect
          ? "text-emerald-300"
          : "text-amber-200";

        panel.innerHTML = `<p class="mb-2 text-xs uppercase tracking-wider text-cyan-300/90">Why</p><p>${escapeHtml(q.explanation)}</p>`;
        panel.classList.remove("hidden");

        card.querySelectorAll("input").forEach((inp) => {
          inp.disabled = true;
        });
      });

      state.score = correct;
      const pct = Math.round((correct / questions.length) * 100);
      scoreEl.innerHTML = `<span class="text-cyan-300 font-semibold">${correct}/${questions.length}</span> · ${pct}%`;
      persistQuizScore(key, correct, questions.length);
      updateProgressUI();
    });

    actions.querySelector('[data-action="reset"]').addEventListener("click", () => {
      state.answers = {};
      state.score = null;
      localStorage.removeItem(`aws-orbit-quiz:${key}`);
      renderQuiz(root);
      updateProgressUI();
    });
  }

  function updateLiveSelection(card, q, chosenIdx) {
    card.querySelectorAll(".quiz-option").forEach((lab, oi) => {
      lab.classList.toggle("border-cyan-400/50", oi === chosenIdx);
      lab.classList.toggle("bg-cyan-950/40", oi === chosenIdx);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function persistQuizScore(key, correct, total) {
    localStorage.setItem(
      `aws-orbit-quiz:${key}`,
      JSON.stringify({ correct, total, at: Date.now() })
    );
  }

  /* --------------------------------------------------------------------------
   * Navigation / progress
   * ------------------------------------------------------------------------ */
  function initNav() {
    const drawer = document.getElementById("mobile-drawer");
    const backdrop = document.getElementById("drawer-backdrop");
    const openBtn = document.getElementById("open-drawer");
    const closeBtn = document.getElementById("close-drawer");

    const setOpen = (open) => {
      if (!drawer || !backdrop) return;
      drawer.classList.toggle("-translate-x-full", !open);
      backdrop.classList.toggle("hidden", !open);
      document.body.classList.toggle("overflow-hidden", open);
      openBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    };

    openBtn?.addEventListener("click", () => setOpen(true));
    closeBtn?.addEventListener("click", () => setOpen(false));
    backdrop?.addEventListener("click", () => setOpen(false));

    document.querySelectorAll("[data-nav]").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    // Scroll spy
    const sections = [...document.querySelectorAll("main section[id]")];
    const tocLinks = [...document.querySelectorAll("[data-nav]")];

    const spy = () => {
      const y = window.scrollY + 120;
      let current = sections[0]?.id;
      sections.forEach((sec) => {
        if (sec.offsetTop <= y) current = sec.id;
      });
      tocLinks.forEach((a) => {
        const active = a.getAttribute("href") === `#${current}`;
        a.classList.toggle("toc-active", active);
      });
    };

    window.addEventListener("scroll", spy, { passive: true });
    spy();

    // Reading progress bar
    const bar = document.getElementById("read-progress");
    const onScrollProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      if (bar) bar.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", onScrollProgress, { passive: true });
    onScrollProgress();
  }

  function updateProgressUI() {
    const keys = Object.keys(QUIZ_BANK);
    let done = 0;
    keys.forEach((k) => {
      if (localStorage.getItem(`aws-orbit-quiz:${k}`)) done += 1;
    });
    const el = document.getElementById("course-progress-label");
    if (el) {
      el.textContent = `${done}/${keys.length} module quizzes completed`;
    }
    const width = `${keys.length ? (done / keys.length) * 100 : 0}%`;
    ["course-progress-fill", "course-progress-fill-desktop"].forEach((id) => {
      const fill = document.getElementById(id);
      if (fill) fill.style.width = width;
    });

    document.querySelectorAll("[data-quiz-status]").forEach((node) => {
      const key = node.dataset.quizStatus;
      const raw = localStorage.getItem(`aws-orbit-quiz:${key}`);
      if (!raw) {
        node.textContent = "Not started";
        node.className =
          "text-[10px] uppercase tracking-wider text-slate-500";
        return;
      }
      try {
        const { correct, total } = JSON.parse(raw);
        node.textContent = `${correct}/${total}`;
        node.className =
          "text-[10px] uppercase tracking-wider text-emerald-400";
      } catch {
        node.textContent = "Saved";
      }
    });
  }

  function initThemeExtras() {
    // Parallax-ish starfield opacity on scroll (subtle)
    const stars = document.getElementById("starfield");
    if (!stars) return;
    window.addEventListener(
      "scroll",
      () => {
        const o = Math.max(0.35, 1 - window.scrollY / 1800);
        stars.style.opacity = String(o);
      },
      { passive: true }
    );
  }

  /* --------------------------------------------------------------------------
   * Boot
   * ------------------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initThemeExtras();
    document.querySelectorAll(".quiz-root").forEach(renderQuiz);
    updateProgressUI();
  });

  // Expose for follow-up modules / console debugging
  window.AWSOrbit = { QUIZ_BANK, renderQuiz, updateProgressUI };
})();
