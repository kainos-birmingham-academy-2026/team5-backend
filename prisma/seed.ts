import { PrismaClient } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function main() {
	const roles = ["applicant", "recruiter", "admin"];
	const roleIds = new Map<string, number>();

	for (const roleName of roles) {
		const role = await prisma.role.upsert({
			where: { name: roleName },
			update: {},
			create: { name: roleName },
		});
		roleIds.set(roleName, role.id);
	}

	const capabilityIds = new Map<string, number>();
	for (const capabilityName of ["Engineering", "Data", "Product"]) {
		const existing = await prisma.capability.findFirst({
			where: { capabilityName },
		});
		const capability =
			existing ??
			(await prisma.capability.create({ data: { capabilityName } }));
		capabilityIds.set(capabilityName, capability.capabilityId);
	}

	const bandIds = new Map<string, number>();
	for (const bandName of ["Band 1", "Band 2", "Band 3", "Band 4"]) {
		const existing = await prisma.band.findFirst({ where: { bandName } });
		const band = existing ?? (await prisma.band.create({ data: { bandName } }));
		bandIds.set(bandName, band.nameId);
	}

	const statusIds = new Map<string, number>();
	for (const statusName of ["Open", "Closed"]) {
		const existing = await prisma.status.findFirst({ where: { statusName } });
		const status =
			existing ?? (await prisma.status.create({ data: { statusName } }));
		statusIds.set(statusName, status.statusId);
	}

	const applicantRoleId = roleIds.get("applicant");
	const recruiterRoleId = roleIds.get("recruiter");

	if (!applicantRoleId || !recruiterRoleId) {
		throw new Error("Required roles were not seeded correctly");
	}

	// Seed John Doe (applicant)
	const johnPassword = await hash("SecurePass@123");
	await prisma.user.upsert({
		where: { email: "john@example.com" },
		update: { password: johnPassword },
		create: {
			email: "john@example.com",
			password: johnPassword,
			roleId: applicantRoleId,
		},
	});

	const jobRoles = [
		{
			roleName: "Senior Software Engineer",
			location: "New York",
			capabilityName: "Engineering",
			bandName: "Band 4",
			closingDate: "2027-12-31",
			status: "Open",
			description: `Lead architectural decisions and mentor a team of 3-5 engineers on building scalable microservices 
and maintaining high code quality standards. You'll be responsible for designing system components, 
establishing coding standards, and developing junior engineers into strong contributors.`,
			responsibilities:
				"Design system architecture, conduct code reviews, mentor junior engineers, collaborate on technical roadmap, and establish best practices for the engineering team.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/senior-software-engineer",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "Junior Software Engineer",
			location: "Boston",
			capabilityName: "Engineering",
			bandName: "Band 1",
			closingDate: "2027-11-15",
			status: "Open",
			description: `Join our team as a Junior Software Engineer and develop core features for our hiring platform while 
learning from experienced mentors. This is a great opportunity to build your foundational skills in a 
supportive environment with hands-on guidance.`,
			responsibilities:
				"Implement new features, write unit tests, participate in code reviews, debug issues, and contribute to technical documentation.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/junior-software-engineer",
			numberOfOpenPositions: 3,
		},
		{
			roleName: "Frontend Engineer",
			location: "San Francisco",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-15",
			status: "Open",
			description: `Build responsive and intuitive user interfaces for our recruitment platform using modern React and 
TypeScript technologies. Create components that not only look great but perform efficiently across all 
devices and browsers while delighting our users.`,
			responsibilities:
				"Develop UI components, optimize performance, ensure cross-browser compatibility, collaborate with designers and backend engineers, and maintain component libraries.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/frontend-engineer",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "Backend Engineer",
			location: "Austin",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-11-30",
			status: "Open",
			description: `Develop and optimize backend services and APIs that power our recruiting platform serving thousands 
of concurrent users. You'll work on scalable infrastructure, handle complex data operations, and ensure 
system reliability and security for our growing user base.`,
			responsibilities:
				"Design APIs, implement database optimizations, ensure system reliability, handle distributed systems challenges, and implement security best practices.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/backend-engineer",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "Full Stack Engineer",
			location: "Seattle",
			capabilityName: "Engineering",
			bandName: "Band 3",
			closingDate: "2027-10-31",
			status: "Open",
			description: `Develop end-to-end features across our entire stack, from responsive frontends to scalable backend services 
and infrastructure. You'll have the autonomy to own features completely while collaborating with teams 
to ensure seamless integration and optimal performance.`,
			responsibilities:
				"Implement full features, optimize performance, manage databases, deploy to production, collaborate across teams, and participate in architecture discussions.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/full-stack-engineer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "DevOps Engineer",
			location: "Denver",
			capabilityName: "Engineering",
			bandName: "Band 3",
			closingDate: "2027-11-20",
			status: "Open",
			description: `Manage infrastructure, CI/CD pipelines, and deployment processes that ensure reliable and scalable 
operations for our platform. You'll work with containerization, orchestration, and automation technologies 
to enable rapid and safe deployments.`,
			responsibilities:
				"Manage cloud infrastructure, implement monitoring and logging, maintain CI/CD pipelines, respond to incidents, and optimize system performance.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/devops-engineer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Cloud Architect",
			location: "Portland",
			capabilityName: "Engineering",
			bandName: "Band 4",
			closingDate: "2027-12-10",
			status: "Open",
			description: `Design and implement cloud-native architectures that support our platform's growth while maintaining 
security, performance, and cost efficiency. Lead technical strategy for cloud adoption and help teams 
adopt cloud best practices.`,
			responsibilities:
				"Design cloud solutions, evaluate cloud services, implement disaster recovery strategies, optimize costs, and mentor engineering teams on cloud best practices.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/cloud-architect",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Data Scientist",
			location: "San Francisco",
			capabilityName: "Data",
			bandName: "Band 3",
			closingDate: "2027-11-30",
			status: "Open",
			description: `Build machine learning models and analyze recruitment data to provide actionable insights that improve 
hiring outcomes and candidate experiences. Collaborate with product and engineering teams to translate 
data into intelligent features.`,
			responsibilities:
				"Develop predictive models, analyze recruitment trends, create data visualizations, present insights to stakeholders, and implement A/B testing frameworks.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/data-scientist",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "Machine Learning Engineer",
			location: "Mountain View",
			capabilityName: "Data",
			bandName: "Band 3",
			closingDate: "2027-12-05",
			status: "Open",
			description: `Build, train, and deploy machine learning models that power candidate matching and recruitment 
intelligence features. Own the full lifecycle of ML models from development to production monitoring 
and optimization.`,
			responsibilities:
				"Develop ML pipelines, optimize model performance, handle data preprocessing, conduct experiments, and deploy models to production.",
			sharepointUrl: "https://sharepoint.local/job-specifications/ml-engineer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Data Engineer",
			location: "Palo Alto",
			capabilityName: "Data",
			bandName: "Band 2",
			closingDate: "2027-11-25",
			status: "Open",
			description: `Build robust data pipelines and infrastructure that enable analytics and machine learning across our 
recruitment platform. Design systems that handle data at scale while maintaining quality and accessibility 
for all data consumers.`,
			responsibilities:
				"Design data architectures, build ETL pipelines, manage data quality, optimize data warehouse queries, and maintain data governance.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/data-engineer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Product Manager",
			location: "Chicago",
			capabilityName: "Product",
			bandName: "Band 4",
			closingDate: "2027-10-15",
			status: "Open",
			description: `Own the product roadmap and strategy for recruiting platform features that delight both applicants 
and recruiters. Drive product vision through customer research, data analysis, and cross-functional 
collaboration with engineering and design teams.`,
			responsibilities:
				"Define product strategy, prioritize features, conduct user research, manage stakeholder communications, and measure product metrics.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/product-manager",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Product Designer",
			location: "Los Angeles",
			capabilityName: "Product",
			bandName: "Band 2",
			closingDate: "2027-11-10",
			status: "Open",
			description: `Create beautiful and intuitive designs for our recruiting platform that guide users through seamless 
hiring experiences. Balance aesthetics with functionality, and collaborate closely with product and 
engineering teams to bring designs to life.`,
			responsibilities:
				"Conduct user research, create wireframes and prototypes, design user interfaces, conduct usability testing, and maintain design systems.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/product-designer",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "UX Researcher",
			location: "San Diego",
			capabilityName: "Product",
			bandName: "Band 2",
			closingDate: "2027-11-18",
			status: "Open",
			description: `Conduct user research and usability studies to inform product decisions and ensure we're building 
solutions that solve real user problems. Be the voice of the customer and guide product strategy 
through evidence-based insights.`,
			responsibilities:
				"Plan and execute user research studies, analyze findings, create personas and journey maps, present insights, and advocate for user needs.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/ux-researcher",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "QA Engineer",
			location: "Dallas",
			capabilityName: "Engineering",
			bandName: "Band 1",
			closingDate: "2027-12-20",
			status: "Open",
			description: `Ensure quality and reliability of our recruiting platform through comprehensive testing and quality 
assurance processes. Work with the engineering team to identify issues early and maintain high standards 
for production releases.`,
			responsibilities:
				"Write test cases, execute manual and automated tests, report bugs, work with developers to resolve issues, and maintain test automation frameworks.",
			sharepointUrl: "https://sharepoint.local/job-specifications/qa-engineer",
			numberOfOpenPositions: 2,
		},
		{
			roleName: "Technical Lead",
			location: "Philadelphia",
			capabilityName: "Engineering",
			bandName: "Band 4",
			closingDate: "2027-10-30",
			status: "Open",
			description: `Lead a team of engineers in delivering high-quality features while setting technical direction and 
fostering a culture of excellence. Balance hands-on coding with leadership, mentoring, and strategic 
technical planning.`,
			responsibilities:
				"Lead team initiatives, mentor engineers, make architectural decisions, handle technical escalations, and communicate with product teams.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/technical-lead",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Engineering Manager",
			location: "Washington DC",
			capabilityName: "Engineering",
			bandName: "Band 4",
			closingDate: "2027-11-05",
			status: "Closed",
			description: `Build and grow a high-performing engineering team that delivers innovative features and maintains 
technical excellence. Manage team growth, performance, and development while aligning engineering 
initiatives with business goals.`,
			responsibilities:
				"Recruit and hire engineers, manage team performance, provide career development, handle team dynamics, and align engineering with business goals.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/engineering-manager",
			numberOfOpenPositions: 0,
		},
		{
			roleName: "Scrum Master",
			location: "Atlanta",
			capabilityName: "Product",
			bandName: "Band 2",
			closingDate: "2027-12-01",
			status: "Open",
			description: `Facilitate agile ceremonies and remove blockers for the team to maximize productivity and delivery 
velocity. Serve as a servant leader who helps teams adopt agile practices and continuously improve 
their processes.`,
			responsibilities:
				"Run daily standups and retrospectives, manage sprint planning, remove impediments, coach team on agile practices, and track metrics.",
			sharepointUrl: "https://sharepoint.local/job-specifications/scrum-master",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Solutions Architect",
			location: "Miami",
			capabilityName: "Engineering",
			bandName: "Band 3",
			closingDate: "2027-11-12",
			status: "Open",
			description: `Design comprehensive solutions that address enterprise customer needs while ensuring technical 
feasibility and business value. Bridge the gap between customer requirements and technical implementation.`,
			responsibilities:
				"Understand customer requirements, design solutions, create architecture documentation, support implementation, and handle customer escalations.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/solutions-architect",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Systems Engineer",
			location: "Phoenix",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-11-28",
			status: "Open",
			description: `Design and implement system-level solutions that ensure reliability, scalability, and performance 
across our infrastructure. Work on critical systems that handle millions of transactions while maintaining 
high availability.`,
			responsibilities:
				"Design systems architecture, manage system upgrades, implement redundancy, handle capacity planning, and optimize system performance.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/systems-engineer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Security Engineer",
			location: "Boston",
			capabilityName: "Engineering",
			bandName: "Band 3",
			closingDate: "2027-12-08",
			status: "Open",
			description: `Protect our platform and customer data through comprehensive security practices, threat analysis, and 
vulnerability management. Lead security initiatives and help the team build security into every feature 
and system.`,
			responsibilities:
				"Implement security best practices, conduct security audits, manage access controls, respond to security incidents, and maintain compliance.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/security-engineer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Database Administrator",
			location: "Houston",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-11-22",
			status: "Open",
			description: `Maintain and optimize database performance while ensuring data integrity, security, and availability 
for our growing platform. Manage databases handling millions of records and support the technical team 
with database expertise.`,
			responsibilities:
				"Manage database infrastructure, optimize queries, implement backup and recovery, handle performance tuning, and ensure security compliance.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/database-admin",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Business Analyst",
			location: "Minneapolis",
			capabilityName: "Product",
			bandName: "Band 1",
			closingDate: "2027-11-30",
			status: "Open",
			description: `Analyze business requirements and market trends to inform product strategy and ensure we're building 
features that drive value. Connect business needs with technical solutions and help measure impact 
on business metrics.`,
			responsibilities:
				"Gather requirements, conduct stakeholder interviews, analyze market data, create business cases, and support product decisions.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/business-analyst",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Technical Writer",
			location: "Portland",
			capabilityName: "Product",
			bandName: "Band 1",
			closingDate: "2027-12-12",
			status: "Open",
			description: `Create clear and comprehensive documentation that helps users understand and effectively use our 
recruiting platform. Transform complex technical concepts into accessible guides that delight users 
and reduce support burden.`,
			responsibilities:
				"Write user guides and API documentation, create tutorials and walkthroughs, maintain documentation systems, and update content regularly.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/technical-writer",
			numberOfOpenPositions: 1,
		},
		{
			roleName: "Release Manager",
			location: "Las Vegas",
			capabilityName: "Engineering",
			bandName: "Band 2",
			closingDate: "2027-12-18",
			status: "Open",
			description: `Coordinate and manage release processes to ensure smooth deployments with minimal risk and maximum 
reliability. Own the release pipeline and help teams deliver features with confidence at scale.`,
			responsibilities:
				"Plan releases, coordinate across teams, manage deployment schedules, handle rollbacks, monitor production, and communicate with stakeholders.",
			sharepointUrl:
				"https://sharepoint.local/job-specifications/release-manager",
			numberOfOpenPositions: 1,
		},
	];
	// Seed Jane Smith (recruiter)
	const janePassword = await hash("RecruitPass#456");
	await prisma.user.upsert({
		where: { email: "jane@example.com" },
		update: { password: janePassword },
		create: {
			email: "jane@example.com",
			password: janePassword,
			roleId: recruiterRoleId,
		},
	});

	await prisma.jobRole.deleteMany();

	for (const { capabilityName, bandName, ...jobRole } of jobRoles) {
		const capabilityId = capabilityIds.get(capabilityName);
		const bandId = bandIds.get(bandName);
		const statusId = statusIds.get(jobRole.status);

		if (!capabilityId || !bandId || !statusId) {
			throw new Error(`Lookup data is missing for ${jobRole.roleName}`);
		}

		const data = { ...jobRole, capabilityId, bandId, statusId };
		const existing = await prisma.jobRole.findFirst({
			where: { roleName: jobRole.roleName, location: jobRole.location },
		});

		if (existing) {
			await prisma.jobRole.update({
				where: { jobRoleId: existing.jobRoleId },
				data,
			});
		} else {
			await prisma.jobRole.create({ data });
		}
	}

	console.log("Seed completed without deleting existing development data.");
}

main().finally(() => prisma.$disconnect());
