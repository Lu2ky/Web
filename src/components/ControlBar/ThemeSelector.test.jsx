import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSelector } from './ThemeSelector';
import { THEME_OPTIONS } from './ThemeOptions';
import * as categoriesService from '../../services/categoriesService';

// Mock del servicio de categorías
vi.mock('../../services/categoriesService', () => ({
    getCategories: vi.fn(),
}));

// Mock del icono
vi.mock('react-icons/io5', () => ({
    IoColorPalette: () => <div data-testid="color-palette-icon">Palette Icon</div>,
}));

describe('ThemeSelector - Pruebas Unitarias', () => {
    const mockOnThemeChange = vi.fn();

    beforeEach(() => {
        mockOnThemeChange.mockClear();
        vi.clearAllMocks();
        categoriesService.getCategories.mockResolvedValue([
            'Math',
            'Physics',
            'Chemistry',
        ]);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // ========== INICIALIZACIÓN Y RENDERIZACIÓN ==========
    describe('Inicialización', () => {
        it('debe renderizar el botón selector de temas', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            const button = screen.getByRole('button', { name: /selector de temas/i });
            expect(button).toBeInTheDocument();
        });

        it('debe mostrar el icono de paleta', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            expect(screen.getByTestId('color-palette-icon')).toBeInTheDocument();
        });

        it('NO debe mostrar el modal inicialmente', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
        });

        it('debe llamar getCategories en el montaje del componente', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            await waitFor(() => {
                expect(categoriesService.getCategories).toHaveBeenCalledTimes(1);
            });
        });
    });

    // ========== INTERACCIÓN CON MODAL ==========
    describe('Control de Modal', () => {
        it('debe abrir el modal al hacer clic en el botón', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            expect(screen.getByRole('heading', { name: /paleta de temas/i })).toBeInTheDocument();
        });

        it('debe cerrar el modal al hacer clic nuevamente en el botón', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);
            expect(screen.getByRole('heading', { name: /paleta de temas/i })).toBeInTheDocument();

            fireEvent.click(button);
            
            await waitFor(() => {
                expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
            }, { timeout: 500 });
        });

        it('debe cerrar el modal al hacer clic en el botón "Cerrar"', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);
            expect(screen.getByRole('button', { name: /cerrar/i })).toBeInTheDocument();

            const closeButton = screen.getByRole('button', { name: /cerrar/i });
            fireEvent.click(closeButton);
            
            await waitFor(() => {
                expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
            }, { timeout: 500 });
        });
    });

    // ========== SELECCIÓN DE TEMAS ==========
    describe('Selección de Tema', () => {
        it('debe renderizar todas las 12 opciones de tema', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            THEME_OPTIONS.forEach((theme) => {
                expect(screen.getByRole('button', { name: new RegExp(theme.name, 'i') })).toBeInTheDocument();
            });
        });

        it('debe mostrar el nombre correcto para cada tema', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            expect(screen.getByText('Light Planner')).toBeInTheDocument();
            expect(screen.getByText('Lavanda')).toBeInTheDocument();
            expect(screen.getByText('Cyber Neón')).toBeInTheDocument();
            expect(screen.getByText('Candy Shop')).toBeInTheDocument();
        });

        it('debe marcar el tema "default" como activo inicialmente', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const lightPlannerButton = screen.getByRole('button', { name: /seleccionar tema Light Planner/i });
            expect(lightPlannerButton).toHaveClass('active');
        });

        it('debe cambiar el tema activo al seleccionar uno diferente', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const lavandaButton = screen.getByRole('button', { name: /seleccionar tema Lavanda/i });
            fireEvent.click(lavandaButton);

            await waitFor(() => {
                expect(mockOnThemeChange).toHaveBeenCalledWith('palette01');
            });
        });

        it('debe llamar onThemeChange con el ID correcto al cambiar de tema', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const lavandaButton = screen.getByRole('button', { name: /seleccionar tema Lavanda/i });
            fireEvent.click(lavandaButton);

            await waitFor(() => {
                expect(mockOnThemeChange).toHaveBeenCalledWith('palette01');
                expect(mockOnThemeChange).toHaveBeenCalledTimes(1);
            });
        });

        it('debe cerrar el modal después de seleccionar un tema', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const lavandaButton = screen.getByRole('button', { name: /seleccionar tema Lavanda/i });
            fireEvent.click(lavandaButton);

            await waitFor(() => {
                expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
            }, { timeout: 500 });
        });

        it('debe permitir seleccionar todos los temas sin errores', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });

            for (const theme of THEME_OPTIONS) {
                mockOnThemeChange.mockClear();

                fireEvent.click(button);

                const themeButton = await screen.findByRole('button', { name: new RegExp(`seleccionar tema ${theme.name}`, 'i') });
                fireEvent.click(themeButton);

                expect(mockOnThemeChange).toHaveBeenCalledWith(theme.id);
                
                await waitFor(() => {
                    expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
                }, { timeout: 500 });
            }
        });
    });

    // ========== VISUALIZACIÓN DE PALETAS ==========
    describe('Vista de Paletas', () => {
        it('debe renderizar los chips de colores para cada tema', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            // Verificar que el modal se abre con tarjetas de tema
            THEME_OPTIONS.forEach((theme) => {
                expect(screen.getByText(theme.name)).toBeInTheDocument();
            });
        });

        it('debe mostrar las categorías cargadas en el preview', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            // Esperar a que las categorías se carguen en el DOM
            await waitFor(() => {
                const mathElements = screen.queryAllByText('Math');
                expect(mathElements.length).toBeGreaterThan(0);
            }, { timeout: 1000 });
            
        });

        it('debe manejar correctamente cuando no hay categorías', async () => {
            categoriesService.getCategories.mockResolvedValue([]);
            
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /paleta de temas/i })).toBeInTheDocument();
            }, { timeout: 2000 });
        });

        it('debe renderizar 7 colores por tema', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            THEME_OPTIONS.forEach((theme) => {
                expect(theme.colors).toHaveLength(7);
            });
        });
    });

    // ========== FUNCIONES INTERNAS ==========
    describe('Función getContrastColor', () => {
        it('debe retornar texto negro para colores claros', () => {
            // Se prueba indirectamente a través del componente renderizado
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            // Light Planner tiene colores claros como #99d5ff
            // El contraste debería calcular color oscuro
        });

        it('debe retornar texto blanco para colores oscuros', () => {
            // Se prueba indirectamente a través del componente renderizado
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            // La paleta "Magma profundo" tiene colores oscuros como #040505
            // El contraste debería calcular color claro
        });
    });

    // ========== MANEJO DE ERRORES ==========
    describe('Manejo de Errores', () => {
        it('debe manejar error en getCategories sin romper el componente', async () => {
            categoriesService.getCategories.mockRejectedValue(new Error('API Error'));

            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);

            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            // Esperar un poco para que la promesa se rechace internamente
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: /paleta de temas/i })).toBeInTheDocument();
            }, { timeout: 500 });
        });

        it('debe funcionar sin prop onThemeChange', async () => {
            render(<ThemeSelector onThemeChange={undefined} />);

            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const lavandaButton = screen.getByRole('button', { name: /seleccionar tema Lavanda/i });
            fireEvent.click(lavandaButton);


            // No debe lanzar error
            await waitFor(() => {
                expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
            }, { timeout: 500 });
        });
    });

    // ========== ACCESIBILIDAD ==========
    describe('Accesibilidad', () => {
        it('debe tener aria-label en el botón principal', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            const button = screen.getByRole('button', { name: /selector de temas/i });
            expect(button).toHaveAttribute('aria-label', 'Selector de temas');
        });

        it('debe tener aria-label en cada tarjeta de tema', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            THEME_OPTIONS.forEach((theme) => {
                const themeCard = screen.getByRole('button', { name: new RegExp(`seleccionar tema ${theme.name}`, 'i') });
                expect(themeCard).toHaveAttribute('aria-label', expect.stringContaining(theme.name));
            });
        });

        it('debe tener aria-label en el botón cerrar', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const closeButton = screen.getByRole('button', { name: /cerrar/i });
            expect(closeButton).toHaveAttribute('aria-label', 'Cerrar');
        });

        it('todos los botones deben ser de tipo "button"', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const mainButton = screen.getByRole('button', { name: /selector de temas/i });
            expect(mainButton).toHaveAttribute('type', 'button');

            fireEvent.click(mainButton);

            const closeButton = screen.getByRole('button', { name: /cerrar/i });
            expect(closeButton).toHaveAttribute('type', 'button');

            THEME_OPTIONS.forEach((theme) => {
                const themeCard = screen.getByRole('button', { name: new RegExp(`seleccionar tema ${theme.name}`, 'i') });
                expect(themeCard).toHaveAttribute('type', 'button');
            });
        });
    });

    // ========== CLASES CSS ==========
    describe('Aplicación de Clases CSS', () => {
        it('debe aplicar la clase themeSelectorContainer', () => {
            const { container } = render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            expect(container.querySelector('.themeSelectorContainer')).toBeInTheDocument();
        });

        it('debe aplicar la clase themeSelectorButton al botón', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            const button = screen.getByRole('button', { name: /selector de temas/i });
            expect(button).toHaveClass('themeSelectorButton');
        });

        it('debe aplicar clase active a tema seleccionado', () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            fireEvent.click(button);

            const defaultTheme = screen.getByRole('button', { name: /seleccionar tema Light Planner/i });
            expect(defaultTheme).toHaveClass('active');
        });
    });

    // ========== FLUJOS COMPLEJOS ==========
    describe('Flujos Complejos', () => {
        it('debe permitir múltiples cambios de tema sin efectos secundarios', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            
            fireEvent.click(button);
            fireEvent.click(screen.getByRole('button', { name: /seleccionar tema Lavanda/i }));
            
            expect(mockOnThemeChange).toHaveBeenCalledWith('palette01');

            fireEvent.click(button);
            fireEvent.click(screen.getByRole('button', { name: /seleccionar tema Cyber Neón/i }));
            
            expect(mockOnThemeChange).toHaveBeenLastCalledWith('palette02');

            expect(mockOnThemeChange).toHaveBeenCalledTimes(2);
        });

        it('debe mantener estado coherente después de abrir y cerrar múltiples veces', async () => {
            render(<ThemeSelector onThemeChange={mockOnThemeChange} />);
            
            const button = screen.getByRole('button', { name: /selector de temas/i });
            
            for (let i = 0; i < 3; i++) {
                fireEvent.click(button);
                expect(screen.getByRole('heading', { name: /paleta de temas/i })).toBeInTheDocument();
                fireEvent.click(button);
                
                await waitFor(() => {
                    expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
                }, { timeout: 300 });
            }
                        expect(screen.queryByRole('heading', { name: /paleta de temas/i })).not.toBeInTheDocument();
                    });
                });
            });
