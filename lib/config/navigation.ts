import { NavGroup } from "@/types/navigation";
export const defaultNavGroups: NavGroup[] = [
	{
		groupLabel: "Main Menu",
		items: [
			{ title: "Overview", href: "/overview", iconName: "LayoutDashboard" },
			{ title: "Facilities", href: "/facilities", iconName: "Building2" },
			{ title: "Equipment", href: "/equipment", iconName: "Activity" },
			{ title: "Predictions", href: "/predictions", iconName: "Brain" },
			{
				title: "Alerts",
				href: "/alerts",
				iconName: "Bell",
				badge: 3,
				badgeVariant: "destructive",
			},
			{ title: "Reports", href: "/reports", iconName: "FileText" },
			{ title: "National", href: "/national", iconName: "Globe" },
			{ title: "About", href: "/about", iconName: "Info" },
		],
	},
];
