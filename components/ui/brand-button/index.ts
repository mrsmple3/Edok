import { cva, type VariantProps } from "class-variance-authority";

export { default as BrandButton } from "./BrandButton.vue";

export const brandButtonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-field font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				primary:
					"bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover",
				outline:
					"border border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary-soft",
				ghost:
					"bg-transparent text-brand-primary hover:bg-brand-primary-soft",
				accent:
					"bg-brand-accent text-white shadow-sm hover:bg-brand-accent/90",
				danger:
					"bg-transparent text-danger hover:bg-danger-soft",
			},
			size: {
				sm: "h-9 px-4 text-sm [&_svg]:size-4",
				md: "h-10 px-6 text-base [&_svg]:size-[18px]",
				lg: "h-12 px-8 text-lg [&_svg]:size-5",
				icon: "h-10 w-10 [&_svg]:size-[18px]",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

export type BrandButtonVariants = VariantProps<typeof brandButtonVariants>;
