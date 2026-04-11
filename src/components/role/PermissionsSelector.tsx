"use client";
import { useGetFeaturesQuery } from "@/lib/services/roleApi";
import type { Page, Action } from "@/types/role";

interface PermissionsSelectorProps {
  selectedFeatures: string[];
  selectedPages: string[];
  selectedActions: string[];
  onFeaturesChange: (ids: string[]) => void;
  onPagesChange: (ids: string[]) => void;
  onActionsChange: (ids: string[]) => void;
}

export default function PermissionsSelector({
  selectedFeatures,
  selectedPages,
  selectedActions,
  onFeaturesChange,
  onPagesChange,
  onActionsChange,
}: PermissionsSelectorProps) {
  const { data: features, isLoading } = useGetFeaturesQuery();

  const allFeatures = features || [];

  const allPages: Page[] = [];
  allFeatures.forEach((feature) => {
    if (selectedFeatures.includes(feature.id) && feature.pages) {
      allPages.push(...feature.pages);
    }
  });

  const actionsByPage: { [pageName: string]: Action[] } = {};
  allPages.forEach((page) => {
    if (selectedPages.includes(page.id) && page.actions) {
      actionsByPage[page.name] = page.actions;
    }
  });

  const allActions: Action[] = [];
  allPages.forEach((page) => {
    if (selectedPages.includes(page.id) && page.actions) {
      allActions.push(...page.actions);
    }
  });

  const isReadAction = (code: string) =>
    code === "READ" || code.toLowerCase().endsWith(".read") || code.toLowerCase() === "read";

  const handleFeatureToggle = (featureId: string) => {
    const newSelection = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter((id) => id !== featureId)
      : [...selectedFeatures, featureId];
    onFeaturesChange(newSelection);
  };

  const handlePageToggle = (pageId: string) => {
    const isSelected = selectedPages.includes(pageId);
    const newSelection = isSelected
      ? selectedPages.filter((id) => id !== pageId)
      : [...selectedPages, pageId];

    onPagesChange(newSelection);

    if (!isSelected) {
      const page = allPages.find((p) => p.id === pageId);
      const readAction = page?.actions?.find((a) => isReadAction(a.code));
      if (readAction && !selectedActions.includes(readAction.id)) {
        onActionsChange([...selectedActions, readAction.id]);
      }
    } else {
      const page = allPages.find((p) => p.id === pageId);
      const pageActionIds = page?.actions?.map((a) => a.id) || [];
      onActionsChange(selectedActions.filter((id) => !pageActionIds.includes(id)));
    }
  };

  const handleActionToggle = (actionId: string) => {
    const action = allActions.find((a) => a.id === actionId);
    if (action && isReadAction(action.code) && selectedActions.includes(actionId)) {
      return;
    }

    const newSelection = selectedActions.includes(actionId)
      ? selectedActions.filter((id) => id !== actionId)
      : [...selectedActions, actionId];
    onActionsChange(newSelection);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 h-[300px]">
      {/* Features/Modules Column */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Modules</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          {allFeatures.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">Aucun module disponible</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {allFeatures.map((feature) => (
                <li key={feature.id}>
                  <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(feature.id)}
                      onChange={() => handleFeatureToggle(feature.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{feature.name}</p>
                      {feature.description && (
                        <p className="text-xs text-gray-500">{feature.description}</p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pages Column */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pages</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedFeatures.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">Sélectionnez un module</p>
          ) : allPages.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">Aucune page disponible</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {allPages.map((page) => (
                <li key={page.id}>
                  <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={() => handlePageToggle(page.id)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{page.name}</p>
                      {page.path && (
                        <p className="text-xs text-gray-500">{page.path}</p>
                      )}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions Column */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedPages.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">Sélectionnez une page</p>
          ) : allActions.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">Aucune action disponible</p>
          ) : (
            <div>
              {Object.entries(actionsByPage).map(([pageName, actions]) => (
                <div key={pageName}>
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-1.5 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{pageName}</p>
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {actions.map((action) => (
                      <li key={action.id}>
                        <label className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <input
                            type="checkbox"
                            checked={selectedActions.includes(action.id)}
                            onChange={() => handleActionToggle(action.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{action.name}</p>
                            <p className="text-xs text-gray-500">{action.code}</p>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
