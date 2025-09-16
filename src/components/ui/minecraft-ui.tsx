import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface MinecraftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export function MinecraftButton({
    className,
    variant = 'primary',
    size = 'md',
    children,
    disabled,
    ...props
}: MinecraftButtonProps) {
    const variants = {
        primary: 'minecraft-button',
        secondary: 'bg-minecraft-stone border-4 border-minecraft-cobblestone border-t-gray-300 border-l-gray-300 border-r-gray-700 border-b-gray-700 hover:bg-gray-500',
        danger: 'bg-red-600 border-4 border-red-400 border-t-red-300 border-l-red-300 border-r-red-800 border-b-red-800 hover:bg-red-500'
    };

    const sizes = {
        sm: 'px-2 py-1 text-minecraft-xs',
        md: 'px-4 py-2 text-minecraft-sm',
        lg: 'px-6 py-3 text-minecraft'
    };

    return (
        <button
            className={cn(
                'font-minecraft text-black font-bold transition-none pixelated',
                variants[variant],
                sizes[size],
                disabled ? 'opacity-50 cursor-not-allowed' : 'active:translate-x-pixel active:translate-y-pixel',
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}

interface MinecraftPanelProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export function MinecraftPanel({ children, className, title }: MinecraftPanelProps) {
    return (
        <div className={cn('minecraft-panel', className)}>
            {title && (
                <div className="mb-4 pb-2 border-b-2 border-gray-500">
                    <h3 className="font-minecraft text-minecraft text-white">{title}</h3>
                </div>
            )}
            {children}
        </div>
    );
}

interface MinecraftInputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export function MinecraftInput({ className, ...props }: MinecraftInputProps) {
    return (
        <input
            className={cn('minecraft-input font-minecraft', className)}
            {...props}
        />
    );
}

interface MinecraftSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}

export function MinecraftSelect({ className, children, ...props }: MinecraftSelectProps) {
    return (
        <select
            className={cn(
                'minecraft-input font-minecraft appearance-none bg-black cursor-pointer',
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
}

interface PixelAvatarProps {
    className?: string;
    color?: string;
    size?: number;
    imageUrl?: string;
    alt?: string;
}

export function PixelAvatar({ className, color = 'minecraft-brown', size = 64, imageUrl, alt = 'Character Avatar' }: PixelAvatarProps) {
    const [imageError, setImageError] = useState(false);

    if (imageUrl && !imageError) {
        return (
            <img
                src={imageUrl}
                alt={alt}
                className={cn(
                    'border-minecraft-thick pixelated border-gray-300',
                    className
                )}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    imageRendering: 'pixelated' as any
                }}
                onError={() => {
                    console.error('Failed to load image:', imageUrl);
                    setImageError(true);
                }}
                onLoad={() => {
                    console.log('Successfully loaded image:', imageUrl);
                }}
            />
        );
    }

    return (
        <div
            className={cn(
                `w-${size} h-${size} border-minecraft-thick pixelated`,
                `bg-${color}`,
                'border-gray-300',
                className
            )}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                imageRendering: 'pixelated' as any
            }}
        />
    );
}
